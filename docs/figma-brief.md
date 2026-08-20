# Briefing para o Figma — Talher Chef

Resumo da interface já implementada em código (HTML/CSS), para recriar/refinar o
design no Figma.

## Versão curta — só funcionalidades (para IA de geração de design)

Use este texto quando quiser que o Figma (Make/First Draft ou outra IA de design)
decida sozinho os componentes, cores e layout — só as regras de funcionamento:

> Crie a interface de um app chamado **Talher Chef**: uma cozinha inteligente que
> reconhece talheres pela webcam e serve o prato certo sozinha, sem nenhum clique.
>
> Funcionalidades que o app precisa ter:
>
> 1. Um jeito de ligar a câmera e começar o reconhecimento ao vivo.
> 2. Reconhecimento em tempo real de três talheres — garfo, faca e colher —
>    mostrando, para cada um, o nível de confiança da predição atualizando
>    continuamente enquanto a câmera está ligada.
> 3. Quando o modelo reconhece um talher com confiança alta, o app reage sozinho:
>    garfo chama macarrão, faca chama carne, colher chama sopa. Essa reação é
>    automática — nunca depende de o usuário clicar em nada.
> 4. A reação precisa ser visível e divertida: uma pequena celebração/animação
>    mostrando a comida "sendo servida" ou "sendo comida" no exato momento em que
>    o talher certo é reconhecido, deixando claro que a ação aconteceu.
> 5. Cada prato tem um contador visível de quantas vezes já foi servido durante a
>    sessão atual.
> 6. Enquanto nenhum talher é reconhecido com confiança suficiente, o app mostra
>    um estado neutro de espera — nunca trava nem mostra uma reação errada.
> 7. Mesmo antes de qualquer detecção, já deve estar claro na tela qual prato
>    pertence a qual talher.
> 8. É uma experiência de sessão única, numa página só — sem login, sem menus,
>    sem telas extras.
>
> Fique à vontade para decidir cores, tipografia, ícones, formato dos elementos e
> estilo visual — só preciso que essas funções fiquem claras e utilizáveis.

---

## 1. Conceito

App de uma tela só (sem navegação), tema escuro, que classifica um talher pela
webcam e "serve" um prato automaticamente. Estilo divertido/lúdico (Pac-Man comendo
o prato), mas com aparência de dashboard técnico nos painéis de câmera e confiança.

## 2. Paleta de cores

| Token       | Valor      | Uso                                  |
|-------------|------------|----------------------------------------|
| bg           | `#14161A`  | Fundo da página                          |
| panel         | `#1E2126`  | Fundo dos cards/painéis                    |
| panel alt      | `#22252B`  | Fundo dos cartões de prato                   |
| plate bg        | `#2A2D33`  | Fundo do "prato" circular e das barras de %   |
| border            | `#2C2F36`  | Bordas de cards (1–2px)                        |
| text                | `#F2F2F2`  | Texto principal                                  |
| muted                 | `#9AA0A6`  | Texto secundário (legendas, status, %)             |
| accent (destaque)       | `#FFB703`  | Botão principal, badges, bordas ativas, títulos      |
| accent gradient            | `#FFB703 → #FB8500` | Preenchimento das barras de confiança    |
| sucesso/eating              | `#2E4D2E`  | (uso pontual, estado ativo alternativo)              |

Raio de borda padrão: **12px** (cards), **999px** (badges pill).

## 3. Tipografia

Fonte: **Segoe UI** (fallback: system-ui, sans-serif).

- Título (H1): ~2rem, bold
- Título de seção (H2): ~1.1rem, bold, cor accent
- Texto padrão: ~1rem
- Texto secundário/legendas: ~0.8–0.9rem, cor muted

## 4. Estrutura da tela (layout)

Largura máxima do conteúdo: ~960px, centralizado.

1. **Header** (topo, centralizado)
   - Título: "🍽️ Talher Chef"
   - Subtítulo (muted): "Aponte a webcam para um talher e veja o prato aparecer
     automaticamente."

2. **Grid principal — 2 colunas em telas ≥800px, 1 coluna no mobile**
   - **Card "Câmera"** (esquerda)
     - Título: "Câmera"
     - Área de vídeo quadrada (~300x300), cantos arredondados, borda sutil
     - Botão primário full-width: "▶ Iniciar câmera" (fundo accent, texto escuro,
       bold)
     - Texto de status abaixo do botão (muted, centralizado): ex. "Câmera ativa —
       aponte um talher."
   - **Card "Classificação em tempo real"** (direita)
     - Título da seção
     - Uma linha por classe (garfo / colher / faca), cada linha com:
       - nome da classe (largura fixa ~90px, capitalizado, bold)
       - barra de progresso horizontal (track cinza escuro, preenchimento em
         gradiente laranja, animação suave de largura)
       - percentual à direita (ex. "91%", muted)

3. **Card "Mesa posta — a ação acontece sozinha"** (largura cheia, abaixo do grid)
   - Título da seção
   - **3 cartões de prato lado a lado** (quebram para baixo no mobile), um para
     cada talher, nesta ordem: **Garfo → Macarrão**, **Faca → Carne**,
     **Colher → Sopa**
     - Cada cartão contém, de cima para baixo:
       1. Emoji do talher (🍴 / 🔪 / 🥄)
       2. "Prato": círculo de 96x96px, fundo escuro, com o emoji da comida
          centralizado (🍝 / 🥩 / 🍲)
       3. Badge circular no canto superior direito do prato: fundo accent, texto
          escuro, pequeno, mostrando quantas vezes aquele prato já foi servido
          (ex. "3×")
       4. Nome do prato abaixo do círculo (muted): "Macarrão" / "Carne" / "Sopa"
     - **Estado padrão (idle):** borda cinza, sem destaque
     - **Estado ativo (detectado):** borda dourada (accent) + leve glow/sombra +
       o cartão "sobe" alguns pixels; dentro do prato, um **Pac-Man** (círculo
       amarelo com uma "boca" recortada) desliza da esquerda para o centro,
       mastigando (animação de abrir/fechar a boca), e o emoji da comida encolhe/
       some no momento da "mordida", reaparecendo em loop enquanto o talher
       continuar sendo detectado
   - Abaixo dos 3 cartões, uma **legenda central**:
     - Estado idle (cor muted): "Aguardando detecção..."
     - Estado ativo (cor accent, bold): "{talher} detectado(a) → servindo
       {prato}!" — ex. "garfo detectado(a) → servindo Macarrão!"

4. **Footer** (centralizado, muted, pequeno)
   - "Projeto acadêmico — Teachable Machine + TensorFlow.js"

## 5. Estados/telas para desenhar no Figma

- **Tela 1 — Antes de iniciar:** botão "Iniciar câmera" habilitado, área de vídeo
  vazia/placeholder, painel de classificação vazio, mesa com os 3 pratos no
  estado idle, legenda "Aguardando detecção...".
- **Tela 2 — Câmera ativa, sem talher detectado:** vídeo ao vivo, barras de
  confiança todas baixas/zeradas, mesa idle.
- **Tela 3 — Talher detectado (ex. garfo):** barra do "Garfo" alta (ex. 91%),
  cartão do Macarrão com borda dourada + Pac-Man mordendo o emoji + badge
  incrementado, legenda em destaque.
- **Tela 4 — Mobile (layout empilhado):** grid vira 1 coluna, os 3 cartões de
  prato quebram em linha(s) conforme o espaço.

## 6. Microinterações a representar (mesmo que estáticas no protótipo)

- Barra de confiança: preenchimento anima suavemente ao mudar de valor.
- Cartão do prato ativo: leve "pop" (escala/sombra) ao entrar no estado ativo.
- Pac-Man: movimento contínuo da esquerda para o centro do prato, boca abrindo/
  fechando (pode ser representado no Figma como 2–3 frames de uma micro-animação
  ou um Smart Animate entre variantes).
- Badge de contagem: "pulso" (escala rápida para cima e volta) toda vez que o
  número incrementa.

## 7. Conteúdo/copy usado

- Título: "🍽️ Talher Chef"
- Subtítulo: "Aponte a webcam para um talher e veja o prato aparecer
  automaticamente."
- Botão: "▶ Iniciar câmera"
- Classes: Garfo, Colher, Faca
- Pratos: Garfo → Macarrão (🍝), Faca → Carne (🥩), Colher → Sopa (🍲)
- Legenda idle: "Aguardando detecção..."
- Legenda ativa: "{talher} detectado(a) → servindo {prato}!"
- Footer: "Projeto acadêmico — Teachable Machine + TensorFlow.js"
