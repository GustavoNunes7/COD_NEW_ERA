# COD New Era

Site institucional da **COD New Era** — HTML, CSS e JavaScript puros (sem framework), com um hero 3D em Three.js carregado sob demanda.

## Como executar

Não precisa de build para rodar. Use qualquer servidor estático:

- **VS Code:** botão direito em `index.html` → *Open with Live Server* (porta 5501 já configurada em `.vscode`).
- **Terminal:** `npx serve .` ou `python3 -m http.server 8000` e abra o endereço indicado.

> Abrir o `index.html` direto (`file://`) também funciona; apenas o menu de transição entre páginas pode não aparecer.

## Estrutura

```
index.html            Home (hero, sobre, time, contato)
Páginas Membros/      4 perfis (template único, navegação anterior/próximo)
styles.css            Design system completo (tokens, componentes, responsivo)
js/main.js            Comportamento: loader, header/menu, scroll, cursor, formulário…
js/hero3d.js          Bundle gerado do Three.js (NÃO editar à mão)
src/hero3d.js         Fonte do hero 3D
fonts/                Fontes self-hosted (Bricolage Grotesque, Instrument Sans, JetBrains Mono)
images/               Logo, marca com transparência, fotos otimizadas (.webp)
```

## Alterar o hero 3D

```bash
npm install
npm run build:3d
```

## Direção de arte

Preto quente + vermelho brasa (extraído da marca) + osso. Tipografia editorial grande, botões chanfrados, fotos do time em duotone vermelho que ganham cor no hover, e uma fita 3D em forma de nuvem que ecoa o logotipo.

## Funcionalidades

- Loader de marca (uma vez por sessão), barra de progresso de rolagem, header que esconde ao descer.
- Menu mobile em tela cheia, links ativos por seção, scroll suave.
- Animações de entrada, destaque palavra a palavra, parallax, cursor customizado, botões magnéticos e tilt nos cards (somente em dispositivos com mouse).
- Hero 3D com versão leve em celulares/dispositivos modestos e **fallback estático** sem WebGL, com `Save-Data` ou `prefers-reduced-motion`.
- Contato: copiar e-mail e formulário com validação e estados (carregando/sucesso/erro) que abre o app de e-mail com a mensagem pronta (`mailto:`) — o site é estático, não há backend.
- Transições entre páginas via View Transitions (navegadores compatíveis).

## Pontos para você revisar

- `codtech@email.com` e `(11) 99999-9999` (contato) e os links das redes no rodapé continuam os do projeto original (genéricos). Troque pelos oficiais.
- As imagens originais (`logo.png`, `*.png/jpeg` das fotos, `imagem PC.png`) foram mantidas, mas o site agora usa as versões `.webp`/`logo-mark.png`; podem ser removidas se não forem mais necessárias.
