# Codebase da softengine - Rasterizador 3D do Fractal de Tomate

Esta é a codebase do projeto de renderizador softengine (sem acelerador grafico; apenas CPU) do blog http://tomatofractal.io/category/rasterizer.html

Atualmente implementado:

- [x] Biblioteca basica vetores/Matrizes 
- [x] Rasterizador de triangulos
- [x] Bresenhan para linhas
- [x] Backface culling
- [x] Matriz de projeção
- [x] Projecao > Viewport > Canvas pipeline
- [x] Flat-shading 
- [x] Gourad shading
- [ ] Phong (sendo desenvolvido atualmente) 
- [ ] Mapeamento de texturas

O objetivo deste repositorio é com fins didaticos, futuras melhorias vao incluir:
- [ ] Melhoramento da biblioteca de Algebra linear (usando closures) 
- [ ] Implementaçao de um rasterizador com WebGL2
- [ ] Implementaçao de shadow map
- [ ] Algoritmos de flocking apenas para benchmark
- [ ] Refatoraçao da codebase com Typescript
- [ ] Refatoraçao da codebase para usar melhores padrões de projeto com melhores design patterns
- [ ] Parser de arquivos wavefront `.obj`

A meta deste blog é a partir dos conceitos basicos de rasterização construir, do zero, um simples motor grafico para jogos 3D para browser.
A intenção é ir do 0 à uma ferramenta capaz de criar jogos simples, sem animaçoes de bones.

<img width="582" alt="Captura de Tela 2024-03-08 às 23 52 57" src="https://github.com/lrdass/cns/assets/66750963/3810e0dd-fcee-4f34-bd5f-cdf6bf53f588">

# Como rodar:

Apos clonar o projeto, basta rodar:
```yarn```
para instalar as dependencias

e para rodar:

```yarn dev```



# Codebase for rasterizer




This is the codebase for the rasterizer being developed at tomatofractal.io

