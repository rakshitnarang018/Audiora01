package main

import (
    "fmt"
    "github.com/gorilla/mux"
)

func main() {
    r := mux.NewRouter()
    fmt.Println("Router initialized:", r)
}
