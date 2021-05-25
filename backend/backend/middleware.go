package backend

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"

	"github.com/oxtoacart/bpool"
)

var (
	bufpool   *bpool.BufferPool
	templates map[string]*template.Template
)

func init() {
	bufpool = bpool.NewBufferPool(48)
}

// AppHandler helps generalize http responses
type AppHandler func(*http.Request) (rsp *Response)

func (fn AppHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if rsp := fn(r); rsp != nil {
		switch rsp.Status {
		case http.StatusOK:
			buf := bufpool.Get()
			defer bufpool.Put(buf)

			var d interface{}
			d = rsp.Response
			if rsp.Error != nil {
				rsp.Response = ""
				rsp.ErrorString = rsp.Error.Error()
			}

			switch rsp.Template {
			case "json":
				w.Header().Set("Content-Type", "application/json")
				if err := json.NewEncoder(buf).Encode(rsp); err != nil {
					http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
					return
				}
			default:
				d = fmt.Errorf("invalid template %q", rsp.Template)
				if err := json.NewEncoder(buf).Encode(d); err != nil {
					http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
					return
				}
			}

			if _, err := buf.WriteTo(w); err != nil {
				http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
				return
			}
		case http.StatusBadRequest:
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		case http.StatusInternalServerError:
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		default:
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}
