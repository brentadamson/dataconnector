package command

import (
	"errors"
	"io/ioutil"
	"net/http"
	"reflect"
	"strings"
	"testing"
)

func TestDirectValid(t *testing.T) {
	for _, c := range []struct {
		name    string
		direct  *Direct
		wantErr error
	}{
		{
			name: "validates",
			direct: &Direct{
				Method: GET,
				Web: Web{
					URL: "https://example.com",
				},
			},
			wantErr: nil,
		},
		{
			name: "invalid method should return error",
			direct: &Direct{
				Method: "not a method",
				Web: Web{
					URL: "https://example.com",
				},
			},
			wantErr: errInvalidMethod,
		},
		{
			name: "invalid url should return error",
			direct: &Direct{
				Method: GET,
				Web: Web{
					URL: "not a url",
				},
			},
			wantErr: errInvalidURL,
		},
	} {
		t.Run(c.name, func(t *testing.T) {
			gotErr := c.direct.Valid()
			if !errors.Is(gotErr, c.wantErr) {
				t.Fatalf("got %v; want %v", gotErr, c.wantErr)
			}
		})
	}
}

func TestDirectDeParameterize(t *testing.T) {
	for _, c := range []struct {
		name    string
		direct  *Direct
		params  []string
		want    *Direct
		wantErr error
	}{
		{
			name: "deparameterizes correctly",
			direct: &Direct{
				Body: "a +++5+++ parameter",
				Web: Web{
					URL: "https://example.com/+++1+++?a=+++2+++",
					Headers: []Header{
						{Key: "+++3+++", Value: "+++4+++"},
					},
				},
			},
			params: []string{"path", "b", "header_key", "header_value", "body"},
			want: &Direct{
				Body: "a body parameter",
				Web: Web{
					URL: "https://example.com/path?a=b",
					Headers: []Header{
						{Key: "header_key", Value: "header_value"},
					},
				},
			},
			wantErr: nil,
		},
		{
			name: "returns on unhandled url parameters",
			direct: &Direct{
				Web: Web{
					URL: "https://example.com/+++1+++?a=+++2+++",
				},
			},
			params: []string{"path"},
			want: &Direct{
				Web: Web{
					URL: "https://example.com/path?a=+++2+++",
				},
			},
			wantErr: errUnhandledParams,
		},
		{
			name: "returns on unhandled header parameters",
			direct: &Direct{
				Web: Web{
					URL: "https://example.com",
					Headers: []Header{
						{Key: "+++1+++", Value: "+++2+++"},
					},
				},
			},
			params: []string{"header_key"},
			want: &Direct{
				Web: Web{
					URL: "https://example.com",
					Headers: []Header{
						{Key: "header_key", Value: "+++2+++"},
					},
				},
			},
			wantErr: errUnhandledParams,
		},
		{
			name: "returns on unhandled body parameters",
			direct: &Direct{
				Body: "+++1+++",
				Web: Web{
					URL: "https://example.com",
				},
			},
			params: []string{},
			want: &Direct{
				Body: "+++1+++",
				Web: Web{
					URL: "https://example.com",
				},
			},
			wantErr: errUnhandledParams,
		},
	} {
		t.Run(c.name, func(t *testing.T) {
			gotErr := c.direct.DeParameterize(c.params)
			if !errors.Is(gotErr, c.wantErr) {
				t.Fatalf("got %v; want %v", gotErr, c.wantErr)
			}

			if !reflect.DeepEqual(c.direct, c.want) {
				t.Fatalf("got %+v; want %+v", c.direct, c.want)
			}
		})
	}
}

func TestDirectAddCredentials(t *testing.T) {
	for _, c := range []struct {
		name        string
		direct      *Direct
		credentials map[string]string
		want        *Direct
		wantErr     error
	}{
		{
			name:        "adds credentials correctly",
			direct:      &Direct{},
			credentials: map[string]string{"mock_credential": "1234567"},
			want: &Direct{
				credentials: map[string]string{"mock_credential": "1234567"},
			},
			wantErr: nil,
		},
	} {
		t.Run(c.name, func(t *testing.T) {
			c.direct.AddCredentials(c.credentials)
			if !reflect.DeepEqual(c.direct, c.want) {
				t.Fatalf("got %+v; want %+v", c.direct, c.want)
			}
		})
	}
}

func TestDirectRun(t *testing.T) {
	// TODO: test that headers get set, etc.
	for _, c := range []struct {
		name    string
		direct  *Direct
		want    string
		wantErr error
	}{
		{
			name: "runs correctly",
			direct: &Direct{
				Client: &mockClient{},
				Method: GET,
				Body:   "request body",
				Web: Web{
					URL: "https://www.example.com/1",
					Headers: []Header{
						{Key: "header_key", Value: "header_value"},
					},
				},
			},
			want:    `{"result":"done"}`,
			wantErr: nil,
		},
		{
			name: "OAuth2 connection runs",
			direct: &Direct{
				Client:      &mockClient{},
				Method:      GET,
				Body:        "request body",
				Provider:    "provider1",
				credentials: map[string]string{"provider1": "1234567"},
				Web: Web{
					URL:     "https://www.example.com/1",
					Headers: []Header{},
				},
			},
			want:    `{"result":"done"}`,
			wantErr: nil,
		},
		{
			name: "unauthorized OAuth2 connection returns error",
			direct: &Direct{
				Client:      &mockClient{},
				Method:      GET,
				Body:        "request body",
				Provider:    "provider2",
				credentials: map[string]string{"provider1": "1234567"},
				Web: Web{
					URL:     "https://www.example.com/1",
					Headers: []Header{},
				},
			},
			want:    "",
			wantErr: errNotAuthorized,
		},
	} {
		t.Run(c.name, func(t *testing.T) {
			got, gotErr := c.direct.Run()
			if !errors.Is(gotErr, c.wantErr) {
				t.Fatalf("got %v; want %v", gotErr, c.wantErr)
			}

			gotStr := string(got)
			if !reflect.DeepEqual(gotStr, c.want) {
				t.Fatalf("got %v; want %v", gotStr, c.want)
			}
		})
	}
}

type mockClient struct{}

func (c *mockClient) Do(req *http.Request) (*http.Response, error) {
	rsp := &http.Response{
		StatusCode: 200,
	}

	switch req.URL.String() {
	case "https://www.example.com/1":
		rsp.Body = ioutil.NopCloser(strings.NewReader(`{"result":"done"}`))
	default:
		rsp.Body = nil
	}

	return rsp, nil
}
