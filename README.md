# АТЛАС — сайт поиска ответов

## Состав
- `index.html` — главная страница.
- `style.css` — дизайн.
- `app.js` — поиск и вывод ответа/ссылок.
- `netlify/functions/search.mjs` — серверная функция поиска.
- `netlify.toml` — настройки Netlify.

## Публикация
1. Загрузите все файлы и папку `netlify/functions` в корень GitHub-репозитория.
2. В настройках Netlify: Build command оставьте пустым, Publish directory установите в `.` (точка).
3. Commit changes в GitHub и дождитесь публикации.

## Важно про поиск
Функция использует `https://api.truegle.info/api/search` и клиентский идентификатор из прежнего прототипа. Работа зависит от доступности и требований авторизации провайдера. Если требуется личный ключ, добавьте его в Netlify → Site configuration → Environment variables с именем `TRUEGLE_API_KEY`.

После публикации можно проверить endpoint:
`/.netlify/functions/search?query=Почему%20небо%20голубое%3F`
