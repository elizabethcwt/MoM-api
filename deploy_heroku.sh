#! /bin/bash
heroku container:push --app=mommon-api web
heroku container:release --app=mommon-api web


# Login before running commands above
# heroku login
# heroku container:login