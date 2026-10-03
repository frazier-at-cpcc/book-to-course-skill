package main

import (
	"io"
	"os"
)

// Run czyta z `in` dwie liczby całkowite (oddzielone spacją lub nową linią)
// i wypisuje do `out` ich iloczyn, a po nim znak nowej linii.
//
// TODO: zaimplementuj Run.
func Run(in io.Reader, out io.Writer) {
}

func main() {
	Run(os.Stdin, os.Stdout)
}
