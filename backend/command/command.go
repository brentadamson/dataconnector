package command

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os/exec"
	"strings"

	"github.com/chromedp/chromedp"
)

const (
	parameter = "+++"
)

var (
	// Runner lets us mock exec.Command for testing
	Runner     = exec.Command
	curlType   = "curl"
	directType = "direct"
	webType    = "web"

	// ErrUnknownCommand indicates the type of command is not recognized
	ErrUnknownCommand  = fmt.Errorf("unknown command type")
	errInvalidURL      = fmt.Errorf("invalid url")
	errUnhandledParams = fmt.Errorf("unhandled params")
	errNotAuthorized   = fmt.Errorf(`OAuth2 service not authorized. Please click the "connect" button`)
)

// Command is an individual command
type Command struct {
	Type      string `json:"type"`
	Commander `json:"-"`
}

// Commander outlines methods to run commands
type Commander interface {
	Valid() (err error)
	DeParameterize(params []string) (err error)
	AddCredentials(credentials map[string]string)
	Run() (bdy []byte, err error)
}

// Response is a command response
type Response struct {
	Body interface{} `json:"body"`
}

func validURL(str string) bool {
	// remove all quotes, etc.
	replacer := strings.NewReplacer(`'`, "", `"`, "", "`", "")
	str = replacer.Replace(str)

	u, err := url.ParseRequestURI(str)
	if err != nil || strings.Contains(u.Scheme, parameter) || strings.Contains(u.Hostname(), parameter) {
		return false
	}

	return true
}

// replaceParameter removes params: turn this: "a +++2+++ string" to this: "a nice string"
func replaceParameter(str string, paramNumber int, val string) string {
	return strings.ReplaceAll(str, fmt.Sprintf("%s%d%s", parameter, paramNumber, parameter), val)
}

// MarshalJSON encodes our Commander as `comamnd`
func (c *Command) MarshalJSON() ([]byte, error) {
	type Alias Command
	return json.Marshal(&struct {
		*Alias
		Command interface{} `json:"command"`
	}{
		Alias:   (*Alias)(c),
		Command: c.Commander,
	})
}

// UnmarshalJSON unmarshals our Commander interface to a struct
func (c *Command) UnmarshalJSON(b []byte) error {
	type Alias Command
	aux := &struct {
		*Alias
	}{
		Alias: (*Alias)(c),
	}

	if err := json.Unmarshal(b, &aux); err != nil {
		return err
	}

	var m map[string]*json.RawMessage
	if err := json.Unmarshal(b, &m); err != nil {
		return err
	}

	commander, ok := m["command"]
	if !ok {
		return fmt.Errorf("missing command")
	}

	switch c.Type {
	case curlType: // TODO
	case directType:
		direct := &Direct{
			Client: HTTPClient,
		}
		if err := json.Unmarshal(*commander, &direct); err != nil {
			return err
		}
		c.Commander = direct
	case webType: // TODO
		web := &Web{
			runner: chromedp.Run,
		}
		if err := json.Unmarshal(*commander, &web); err != nil {
			return err
		}
		c.Commander = web
	default:
		return ErrUnknownCommand
	}

	return nil
}
