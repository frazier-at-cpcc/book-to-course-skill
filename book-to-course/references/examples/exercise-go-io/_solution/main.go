package main

import (
	"fmt"
	"io"
	"os"
)

// Run czyta z `in` dwie liczby całkowite i wypisuje do `out` ich iloczyn.
func Run(in io.Reader, out io.Writer) {
	var a, b int
	fmt.Fscan(in, &a, &b)
	fmt.Fprintln(out, a*b)
}

func main() {
	Run(os.Stdin, os.Stdout)
}
