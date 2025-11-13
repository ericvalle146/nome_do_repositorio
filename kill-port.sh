#!/bin/bash

# Script para matar processo na porta 3001

PORT=3001

echo "🔍 Procurando processo na porta $PORT..."

# Verifica qual processo está usando a porta
PID=$(lsof -ti:$PORT 2>/dev/null || fuser $PORT/tcp 2>/dev/null | awk '{print $1}')

if [ -z "$PID" ]; then
    # Tenta com netstat
    PID=$(netstat -tlnp 2>/dev/null | grep ":$PORT " | awk '{print $7}' | cut -d'/' -f1 | head -1)
fi

if [ -z "$PID" ]; then
    # Tenta com ss
    PID=$(ss -tlnp 2>/dev/null | grep ":$PORT " | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2 | head -1)
fi

if [ -z "$PID" ]; then
    echo "❌ Nenhum processo encontrado na porta $PORT"
    exit 1
fi

echo "📋 Processo encontrado: PID $PID"
echo "📝 Informações do processo:"
ps -p $PID -o pid,ppid,cmd 2>/dev/null || echo "Processo não encontrado"

echo ""
read -p "⚠️  Deseja matar o processo $PID? (s/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🔄 Matando processo $PID..."
    kill -9 $PID 2>/dev/null
    sleep 1
    
    # Verifica se foi morto
    if ps -p $PID > /dev/null 2>&1; then
        echo "❌ Erro ao matar processo $PID"
        exit 1
    else
        echo "✅ Processo $PID morto com sucesso!"
    fi
else
    echo "❌ Operação cancelada"
    exit 0
fi

