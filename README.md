# Sol e Mar Premium

Crie um site PREMIUM e responsivo para Sol e Mar Rent a Car, uma locadora de veículos.

Vou anexar a logo oficial. Coloque ela no projeto e Use-a como referência de identidade visual e extraia dela a paleta de cores. Priorize azul escuro, branco e amarelo, com aparência sofisticada, moderna e profissional.

DESIGN

Quero um visual extremamente bonito e premium, inspirado no nível visual de empresas modernas de mobilidade, turismo e tecnologia.

Priorize:

Hero impactante com carro/viagem

Tipografia elegante

Muito espaço visual

Azul escuro como base

Amarelo nos CTAs e destaques

Cards modernos

Fotos grandes e bem posicionadas

Microanimações sutis

Excelente experiência mobile

Layout sofisticado, NÃO parecendo template genérico

ESTRUTURA

Crie:

Home

Catálogo de veículos

Página individual do veículo

Sistema de reserva online

Como funciona

Sobre a empresa

FAQ

Contato

Login administrativo

Dashboard administrativo

RESERVAS

Criar fluxo:

Período → veículos disponíveis → escolher veículo → dados do cliente → resumo → confirmar reserva

O sistema deve verificar automaticamente conflitos de datas e impedir reservas simultâneas do mesmo veículo.

Cada veículo deve possuir:

fotos

nome

categoria

câmbio

combustível

passageiros

diária

status

Status:
Disponível / Reservado / Em locação / Manutenção

PAINEL ADMINISTRATIVO

Permitir:

gerenciar veículos

gerenciar fotos

gerenciar reservas

gerenciar clientes

alterar preços

controlar disponibilidade

calendário de reservas

alterar status das reservas

dashboard com indicadores

REGRA MAIS IMPORTANTE — INDEPENDÊNCIA

NÃO criar nenhuma dependência de serviços pagos, banco de dados, hospedagem, autenticação ou infraestrutura proprietária da Lovable.

O projeto deve ser 100% portátil e exportável.

Utilize somente tecnologias abertas/padrão:

React

TypeScript

Vite

Tailwind CSS

componentes reutilizáveis

Supabase externo para banco/autenticação/storage, conectado exclusivamente através de variáveis de ambiente

O projeto deve funcionar fora da Lovable.

Não utilizar:

Lovable Cloud

banco interno da Lovable

APIs proprietárias da Lovable

autenticação proprietária

funções proprietárias

qualquer recurso que me obrigue a pagar ou permanecer na Lovable

Todas as configurações externas devem ficar em .env / .env.example.

O código deve poder ser baixado, colocado no GitHub e hospedado posteriormente na Vercel ou qualquer outro serviço compatível, sem depender da Lovable.

IMPORTANTE

Não invente informações reais da empresa. Use placeholders editáveis para telefone, endereço, WhatsApp, preços e veículos.

Priorize qualidade visual + arquitetura limpa + independência da Lovable.

Não desperdice créditos explicando o processo. Construa diretamente o projeto.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sol-mar-drive-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2f5af2b1-9ea1-4a3b-b0d5-07b9d6dcecf4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
