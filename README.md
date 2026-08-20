# 🍽️ Talher Chef — Classificador de Talheres com Ação Automática

Projeto acadêmico de Inteligência Artificial: um modelo treinado no **Teachable Machine**
é exportado em **TensorFlow.js** e integrado a uma aplicação web que classifica talheres
ao vivo pela webcam e, a partir da predição, dispara automaticamente a exibição do prato
correspondente.

> Nenhum botão é clicado para disparar a ação — ela acontece sozinha quando o modelo
> reconhece o talher com confiança suficiente.

## Autor

- Pollyana de Castro Rodrigues


## Como funciona / regra de negócio

A interface segue um tema "Ristorante" (Talher Chef · La Cucina Intelligente), com um
"Menu do Chef" mostrando os três pratos sempre visíveis:

| Talher detectado | Prato servido                        |
|-------------------|----------------------------------------|
| 🍴 Garfo           | Macarrão — *Pasta al Pomodoro*           |
| 🔪 Faca            | Carne — *Bistecca alla Fiorentina*       |
| 🥄 Colher          | Sopa — *Zuppa del Giorno*                |

Quando uma classe se mantém acima de **90% de confiança por pelo menos 600ms seguidos**,
a ação dispara automaticamente: o cartão do prato correspondente ganha destaque (borda +
brilho na cor do talher) com uma animação de "chacoalhar", partículas temáticas sobem pela
tela, um banner central "Servido!" aparece por alguns segundos, e os contadores "SERVIDO Nx"
do prato e o "Total da Sessão" são incrementados. Esse limiar alto + a exigência de
confiança sustentada (não só um frame isolado) evitam que a interface dispare ações à toa
por ruído de predições instáveis; enquanto nenhuma classe atinge esses critérios, a tela
permanece no estado neutro.

> ⚠️ Mesmo com essas travas, o modelo pode ocasionalmente classificar a cena vazia como um
> dos três talheres, porque ele não tem uma classe de fundo/"nada" — veja a seção
> [Classes treinadas](#classes-treinadas) abaixo para o porquê e como corrigir na raiz
> (retreinando com uma classe neutra).

## Classes treinadas

O modelo (`model/`) foi treinado no Teachable Machine com as classes:

- `garfo`
- `colher`
- `faca`

> ⚠️ **Melhoria recomendada:** o modelo atual não possui uma classe de fundo
> (`nada` / `neutro`). Sem ela, o modelo é forçado a sempre escolher um dos três talheres,
> mesmo quando nada relevante está na cena, o que pode disparar ações indevidas. Para uma
> versão mais robusta, retreine incluindo uma classe `nada` com fotos de fundo vazio, mãos,
> outros objetos etc., e ajuste `DISH_INFO` em `script.js` se necessário.

## Stack

- **TensorFlow.js** (`@teachablemachine/image`) — inferência 100% no navegador, sem back-end.
- HTML + CSS + JavaScript puro (sem build step).

## Estrutura do repositório

```
iateste/
├── index.html          # marcação da página (webcam, predições, painel de ação)
├── style.css            # estilos da interface
├── script.js             # carrega o modelo, roda a inferência e dispara as ações
├── model/                 # modelo exportado do Teachable Machine (TensorFlow.js)
│   ├── model.json
│   ├── metadata.json
│   └── weights.bin
├── docs/                    # prints/GIFs de demonstração
├── .gitignore
└── README.md
```

## Como rodar localmente

Pré-requisitos: um navegador moderno (Chrome/Edge/Firefox) com acesso à webcam.

A aplicação não tem dependências de Node — só precisa ser servida por um servidor local
(não abra o `index.html` direto com duplo clique: o navegador bloqueia `fetch` de arquivos
locais e a webcam exige `http(s)`/`localhost`).

Escolha **uma** das opções abaixo, a partir da raiz do repositório:

### Opção 1 — Python (já vem instalado na maioria dos sistemas)

```bash
python -m http.server 8000
```

Depois abra: http://localhost:8000

### Opção 2 — Node.js

```bash
npx serve .
```

Depois abra o endereço mostrado no terminal (geralmente http://localhost:3000).

### Opção 3 — Extensão "Live Server" do VS Code

Clique com o botão direito em `index.html` → **Open with Live Server**.

---

Com a página aberta:

1. Clique em **"Ligar Câmera"** e permita o acesso à webcam quando solicitado.
2. Aponte um garfo, uma faca ou uma colher para a câmera.
3. Observe a confiança de cada classe atualizando em tempo real no painel "Detecção em
   Tempo Real".
4. Quando a confiança de uma classe se mantiver acima de 90% por cerca de 600ms, o prato
   correspondente é servido automaticamente: banner "Servido!", partículas e os contadores
   atualizados no "Menu do Chef".

## Treinando/atualizando o modelo

1. Acesse https://teachablemachine.withgoogle.com/train/image
2. Crie as classes `garfo`, `colher`, `faca` (e, idealmente, `nada`).
3. Colete fotos variadas (ângulos, iluminações e fundos diferentes) para cada classe.
4. Treine o modelo.
5. Em **Export Model**, escolha a aba **Tensorflow.js** → **Upload (shareable link)** ou
   **Download**, e baixe os três arquivos (`model.json`, `metadata.json`, `weights.bin`).
6. Substitua os arquivos dentro da pasta `model/` deste repositório.

## Interface gráfica criada através do Figma.IA
