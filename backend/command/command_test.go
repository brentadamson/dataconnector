package command

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestMarshalAndUnmarshalJSON(t *testing.T) {
	for _, c := range []struct {
		name string
		cmd  *Command
	}{
		{
			name: "marshals and unmarshals a direct command",
			cmd: &Command{
				Type: directType,
				Commander: &Direct{
					Client:   HTTPClient,
					Method:   GET,
					Body:     "request body",
					Provider: "github",
					Web: Web{
						URL: "http://example.com/+++1+++/+++2+++",
					},
				},
			},
		},
		{
			name: "marshals and unmarshals a web command",
			cmd: &Command{
				Type: webType,
				Commander: &Web{
					URL: "http://example.com/+++1+++/+++2+++",
					Headers: []Header{
						{Key: "header_key", Value: "header_value"},
					},
				},
			},
		},
	} {
		t.Run(c.name, func(t *testing.T) {
			gotBytes, err := json.Marshal(c.cmd)
			if err != nil {
				t.Fatal(err)
			}

			var got *Command
			if err := json.Unmarshal(gotBytes, &got); err != nil {
				t.Fatal(err)
			}

			// ensure chromedp runner matches
			if got.Type == webType {
				/*
					TODO: revisit this
					if !equal(&got.Commander.(*Web).runner, &c.want.Commander.(*Web).runner) {
						t.Fatalf("expected a chromedp runner: got %+v; want %+v", got.Commander, c.want.Commander)
					}
				*/
				if got.Commander.(*Web).runner == nil {
					t.Fatal("expected a chromedp runner: got nil", got.Commander)
				}

				got.Commander.(*Web).runner = nil
			}

			if !reflect.DeepEqual(got, c.cmd) {
				t.Fatalf("got %+v; want %+v", got, c.cmd)
			}
		})
	}
}

func equal(a, b interface{}) bool {
	av := reflect.ValueOf(&a).Elem()
	bv := reflect.ValueOf(&b).Elem()
	return av.InterfaceData() == bv.InterfaceData()
}
