FROM golang:1.18 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY ./src ./src
COPY ./api ./api
COPY ./config ./config

RUN go build -o pdf-to-img-service ./src/main.go

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/pdf-to-img-service .

CMD ["./pdf-to-img-service"]