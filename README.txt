DUTRA VEÍCULOS — COMO USAR

1. Abra index.html no navegador para visualizar o site.
2. A foto do banner está em assets/images/banner-polo.jpg.
3. As fotos dos veículos devem ficar em assets/images.
4. Os veículos publicados ficam em vehicles-data.js. Este é o arquivo que o index.html lê diretamente.
5. Para cadastrar ou editar veículos:
   - abra admin.html no navegador;
   - preencha o formulário;
   - as alterações ficam em memória até você exportar;
   - em imagens, use caminhos como assets/images/polo-01.jpg ou URLs públicas, uma por linha;
   - clique em Exportar dados para copiar o conteúdo pronto;
   - substitua o conteúdo de vehicles-data.js pelo texto exportado;
   - faça commit e push para publicar no GitHub Pages.
6. Para trocar o WhatsApp, edite WHATSAPP_NUMBER no começo de script.js.
7. Para ativar o formulário:
   - crie um formulário no Formspree;
   - cadastre gilsondfilho@icloud.com;
   - copie o endpoint fornecido;
   - substitua COLE_AQUI_O_ENDPOINT_DO_FORMSPREE no atributo action do formulário em index.html.
8. Para publicar, envie a pasta completa para uma hospedagem estática como Netlify, GitHub Pages ou servidor próprio.

CONTROLE INTERNO

1. Abra dashboard.html para acompanhar compra, despesas, venda e lucro por veículo.
2. O painel usa vehicles-data.js para saber quais veículos existem.
3. Os dados financeiros ficam em business-data.js.
4. Nada é salvo no navegador: ao editar no painel, clique em Exportar controle e substitua o conteúdo de business-data.js pelo texto copiado.
5. Não coloque business-data.js em uma hospedagem pública se ele tiver dados sensíveis reais.

Observação: os veículos sem dados confirmados aparecem como "A confirmar" ou "Preço sob consulta" para evitar informações inventadas.
Observação sobre o admin: por ser um site estático, o painel não grava diretamente no GitHub nem no navegador. Ele mantém alterações em memória e exporta o conteúdo pronto para atualizar vehicles-data.js.
Observação local: o site usa vehicles-data.js para funcionar mesmo abrindo index.html direto no navegador, sem servidor local.
Validação: rode node validate-data.js para conferir se os caminhos de imagens cadastrados existem.
