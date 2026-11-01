# DZ8 — Backstage

Одностраничный TypeScript-сайт для музыкантов: регистрация, вход, выход и просмотр/редактирование профиля через API из Swagger.

## Запуск локально

```sh
npm ci
npm run dev
```

Для production-сборки:

```sh
npm run build
```

По умолчанию сайт обращается к `https://inai-col2.fishrungames.com`. Чтобы задать другой API, укажите `VITE_API_BASE_URL` при сборке, например:

```sh
VITE_API_BASE_URL=https://api.example.com npm run build
```

## Публикация на GitHub Pages

Workflow `.github/workflows/deploy.yml` собирает сайт при push в `main` или `master` и публикует его через GitHub Pages. В настройках репозитория откройте **Settings → Pages** и выберите **GitHub Actions** как источник публикации.

Так как GitHub Pages и API работают на разных доменах, API-сервер должен разрешать запросы с origin опубликованного сайта и credentials/cookies. Это нужно настроить на стороне backend; браузер не может включить CORS со стороны клиента.
