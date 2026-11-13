#include <vector>
#include "formato.hpp"
int main() {
    int n; std::cin >> n;
    std::vector<long long> valori(n);
    for (auto& v : valori) std::cin >> v;
    // TODO: calcola somma e massimo; tratta anche n == 0.
    stampa(0, 0);
}
