package main

import (
	"bytes"
	"strings"
	"testing"
)

func TestRun(t *testing.T) {
	cases := []struct{ name, in, want string }{
		{"proste liczby", "3 4\n", "12\n"},
		{"liczby ujemne", "-2 5\n", "-10\n"},
		{"zero", "0 99\n", "0\n"},
		{"liczby w osobnych liniach", "6\n7\n", "42\n"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			var out bytes.Buffer
			Run(strings.NewReader(c.in), &out)
			if out.String() != c.want {
				t.Errorf("dla wejścia %q program wypisał %q, a powinien %q", c.in, out.String(), c.want)
			}
		})
	}
}
