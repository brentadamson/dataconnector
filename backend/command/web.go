package command

import (
	"context"
	"strings"

	"github.com/chromedp/cdproto/dom"
	"github.com/chromedp/chromedp"
)

// Web executes a command as a headless browser
type Web struct {
	URL     string   `json:"url"`
	Headers []Header `json:"headers,omitempty"`
	runner  func(ctx context.Context, actions ...chromedp.Action) error
	result  string
}

// Header is an HTTP header
type Header struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// Valid validates a Web command
func (w *Web) Valid() error {
	if !validURL(w.URL) {
		return errInvalidURL
	}

	return nil
}

// DeParameterize replaces parameters in the url, headers, and body
func (w *Web) DeParameterize(params []string) (err error) {
	for i, p := range params {
		w.URL = replaceParameter(w.URL, i+1, p)
		for j := range w.Headers {
			w.Headers[j].Key = replaceParameter(w.Headers[j].Key, i+1, p)
			w.Headers[j].Value = replaceParameter(w.Headers[j].Value, i+1, p)
		}
	}
	if strings.Contains(w.URL, parameter) {
		return errUnhandledParams
	}
	for _, header := range w.Headers {
		if strings.Contains(header.Key, parameter) || strings.Contains(header.Value, parameter) {
			return errUnhandledParams
		}
	}

	return
}

// AddCredentials adds the user's OAuth2 credentials (if applicable)
func (w *Web) AddCredentials(creds map[string]string) {}

// Run executes a command with a headless browser
// TODO: Set headers, etc...
func (w *Web) Run() (bdy []byte, err error) {
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	err = w.runner(ctx, chromedp.Navigate(w.URL), chromedp.ActionFunc(func(ctx context.Context) error {
		node, err := dom.GetDocument().Do(ctx)
		if err != nil {
			return err
		}
		w.result, err = dom.GetOuterHTML().WithNodeID(node.NodeID).Do(ctx)
		return err
	}),
	)

	if err != nil {
		return nil, err
	}

	bdy = []byte(w.result)
	return
}
