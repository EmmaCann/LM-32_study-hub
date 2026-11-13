#include <iostream>
#include <memory>
struct Nodo {
    long long valore;
    std::unique_ptr<Nodo> next;
    explicit Nodo(long long v) : valore(v) {}
};
int main() {
    int n; std::cin >> n;
    std::unique_ptr<Nodo> testa;
    // TODO: costruisci e visita la lista.
    std::cout << "0 0\n";
}
