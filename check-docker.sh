#!/bin/bash

# Script para verificar redes e containers Docker
# Execute na VPS: bash check-docker.sh

echo "=========================================="
echo "🐳 Verificando Containers Docker"
echo "=========================================="
echo ""
docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "=========================================="
echo "🌐 Verificando Redes Docker"
echo "=========================================="
echo ""
docker network ls
echo ""

echo "=========================================="
echo "📋 Detalhes das Redes"
echo "=========================================="
echo ""
for network in $(docker network ls -q); do
  network_name=$(docker network inspect $network --format '{{.Name}}')
  echo "--- Rede: $network_name ---"
  docker network inspect $network --format '  Containers: {{range .Containers}}{{.Name}} ({{.IPv4Address}}) {{end}}'
  echo ""
done

echo "=========================================="
echo "🔍 Containers e suas Redes"
echo "=========================================="
echo ""
for container in $(docker ps -q); do
  container_name=$(docker inspect $container --format '{{.Name}}')
  echo "Container: $container_name"
  docker inspect $container --format '  Redes: {{range $key, $value := .NetworkSettings.Networks}}{{$key}} ({{$value.IPAddress}}) {{end}}'
  echo ""
done

echo "=========================================="
echo "📊 Resumo"
echo "=========================================="
echo ""
echo "Total de containers: $(docker ps -a -q | wc -l)"
echo "Containers rodando: $(docker ps -q | wc -l)"
echo "Total de redes: $(docker network ls -q | wc -l)"
echo ""

