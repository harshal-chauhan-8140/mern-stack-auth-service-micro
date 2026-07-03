Build docker image: docker build -t auth-service:dev -f docker/development/Dockerfile .

Run docker image: docker run --rm -it -v $(pwd):/usr/src/app -v /usr/src/app/node_modules --env-file $(pwd)/.env -p 5501:5501 -e NODE_ENV=development auth-prep:dev
