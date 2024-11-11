SHELL=/bin/bash

.all: dev

dev:
	cd apps/expo; \
	bun dev