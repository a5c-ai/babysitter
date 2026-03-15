---
name: node-operations
description: Blockchain node deployment and operations. Supports Ethereum execution and consensus clients, validator operations, node monitoring, MEV-Boost configuration, and archive node management.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Blockchain Node Operations Skill

Expert blockchain node deployment and operations for Ethereum and EVM-compatible networks.

## Capabilities

- **Execution Clients**: Deploy Geth, Nethermind, Besu, Erigon
- **Consensus Clients**: Configure Prysm, Lighthouse, Teku, Lodestar
- **Validator Operations**: Set up validators with proper key management
- **Monitoring**: Monitor sync status and performance
- **MEV-Boost**: Configure for validators
- **Archive Nodes**: Set up archive nodes for indexing
- **Migrations**: Handle node upgrades and migrations

## Execution Client Setup

### Geth Installation

```bash
# Install Geth
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install ethereum

# Or download binary
wget https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.13.0-xxx.tar.gz
tar -xvf geth-linux-amd64-*.tar.gz
sudo mv geth-linux-amd64-*/geth /usr/local/bin/
```

### Geth Configuration

```bash
# Create data directory
mkdir -p /var/lib/geth

# Create service file
cat > /etc/systemd/system/geth.service << EOF
[Unit]
Description=Geth Execution Client
After=network.target
Wants=network.target

[Service]
User=geth
Group=geth
Type=simple
Restart=always
RestartSec=5
ExecStart=/usr/local/bin/geth \
  --mainnet \
  --datadir /var/lib/geth \
  --http \
  --http.addr 0.0.0.0 \
  --http.port 8545 \
  --http.api eth,net,web3,engine,admin \
  --ws \
  --ws.addr 0.0.0.0 \
  --ws.port 8546 \
  --authrpc.addr localhost \
  --authrpc.port 8551 \
  --authrpc.vhosts localhost \
  --authrpc.jwtsecret /var/lib/geth/jwt.hex \
  --metrics \
  --metrics.addr 0.0.0.0 \
  --metrics.port 6060 \
  --syncmode snap \
  --maxpeers 50

[Install]
WantedBy=multi-user.target
EOF

# Generate JWT secret
openssl rand -hex 32 > /var/lib/geth/jwt.hex

# Start service
sudo systemctl daemon-reload
sudo systemctl enable geth
sudo systemctl start geth
```

### Nethermind Configuration

```bash
cat > /etc/systemd/system/nethermind.service << EOF
[Unit]
Description=Nethermind Execution Client
After=network.target

[Service]
User=nethermind
Type=simple
Restart=always
ExecStart=/usr/local/bin/nethermind \
  --config mainnet \
  --datadir /var/lib/nethermind \
  --JsonRpc.Enabled true \
  --JsonRpc.Host 0.0.0.0 \
  --JsonRpc.Port 8545 \
  --JsonRpc.JwtSecretFile /var/lib/nethermind/jwt.hex \
  --JsonRpc.EngineHost 127.0.0.1 \
  --JsonRpc.EnginePort 8551 \
  --Metrics.Enabled true \
  --Metrics.ExposePort 6060 \
  --Sync.SnapSync true

[Install]
WantedBy=multi-user.target
EOF
```

## Consensus Client Setup

### Lighthouse

```bash
# Install Lighthouse
curl -LO https://github.com/sigp/lighthouse/releases/download/v4.5.0/lighthouse-v4.5.0-x86_64-unknown-linux-gnu.tar.gz
tar -xvf lighthouse-*.tar.gz
sudo mv lighthouse /usr/local/bin/

# Beacon node service
cat > /etc/systemd/system/lighthouse-beacon.service << EOF
[Unit]
Description=Lighthouse Beacon Node
After=network.target geth.service
Wants=geth.service

[Service]
User=lighthouse
Type=simple
Restart=always
ExecStart=/usr/local/bin/lighthouse bn \
  --network mainnet \
  --datadir /var/lib/lighthouse \
  --execution-endpoint http://localhost:8551 \
  --execution-jwt /var/lib/geth/jwt.hex \
  --checkpoint-sync-url https://beaconstate.ethstaker.cc \
  --http \
  --http-address 0.0.0.0 \
  --http-port 5052 \
  --metrics \
  --metrics-address 0.0.0.0 \
  --metrics-port 5054

[Install]
WantedBy=multi-user.target
EOF
```

### Prysm

```bash
# Install Prysm
curl https://raw.githubusercontent.com/prysmaticlabs/prysm/master/prysm.sh --output prysm.sh
chmod +x prysm.sh

# Beacon node service
cat > /etc/systemd/system/prysm-beacon.service << EOF
[Unit]
Description=Prysm Beacon Node
After=network.target

[Service]
User=prysm
Type=simple
Restart=always
ExecStart=/usr/local/bin/prysm.sh beacon-chain \
  --mainnet \
  --datadir=/var/lib/prysm \
  --execution-endpoint=http://localhost:8551 \
  --jwt-secret=/var/lib/geth/jwt.hex \
  --checkpoint-sync-url=https://beaconstate.ethstaker.cc \
  --genesis-beacon-api-url=https://beaconstate.ethstaker.cc \
  --grpc-gateway-host=0.0.0.0 \
  --grpc-gateway-port=3500 \
  --monitoring-host=0.0.0.0 \
  --monitoring-port=8080

[Install]
WantedBy=multi-user.target
EOF
```

## Validator Setup

### Key Generation

```bash
# Install deposit-cli
wget https://github.com/ethereum/staking-deposit-cli/releases/download/v2.7.0/staking_deposit-cli-fdab65d-linux-amd64.tar.gz
tar -xvf staking_deposit-cli-*.tar.gz

# Generate validator keys
./deposit new-mnemonic --num_validators 1 --chain mainnet

# Import keys to Lighthouse
lighthouse account validator import \
  --network mainnet \
  --datadir /var/lib/lighthouse \
  --directory validator_keys

# Import keys to Prysm
./prysm.sh validator accounts import \
  --mainnet \
  --keys-dir=validator_keys
```

### Validator Client

```bash
# Lighthouse validator service
cat > /etc/systemd/system/lighthouse-validator.service << EOF
[Unit]
Description=Lighthouse Validator
After=lighthouse-beacon.service
Wants=lighthouse-beacon.service

[Service]
User=lighthouse
Type=simple
Restart=always
ExecStart=/usr/local/bin/lighthouse vc \
  --network mainnet \
  --datadir /var/lib/lighthouse \
  --beacon-nodes http://localhost:5052 \
  --graffiti "MyValidator" \
  --metrics \
  --metrics-address 0.0.0.0 \
  --metrics-port 5064 \
  --suggested-fee-recipient 0xYourAddress

[Install]
WantedBy=multi-user.target
EOF
```

## MEV-Boost Setup

```bash
# Install MEV-Boost
go install github.com/flashbots/mev-boost@latest

# MEV-Boost service
cat > /etc/systemd/system/mev-boost.service << EOF
[Unit]
Description=MEV-Boost
After=network.target

[Service]
User=mevboost
Type=simple
Restart=always
ExecStart=/usr/local/bin/mev-boost \
  -mainnet \
  -relay-check \
  -relay https://0xac6e77dfe25ecd6110b8e780608cce0dab71fdd5ebea22a16c0205200f2f8e2e3ad3b71d3499c54ad14d6c21b41a37ae@boost-relay.flashbots.net \
  -relay https://0xa1559ace749633b997cb3fdacffb890aeebdb0f5a3b6aaa7eeeaf1a38af0a8fe88b9e4b1f61f236d2e64d95733327a62@relay.ultrasound.money

[Install]
WantedBy=multi-user.target
EOF
```

## Monitoring

### Prometheus Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'geth'
    static_configs:
      - targets: ['localhost:6060']

  - job_name: 'lighthouse_beacon'
    static_configs:
      - targets: ['localhost:5054']

  - job_name: 'lighthouse_validator'
    static_configs:
      - targets: ['localhost:5064']
```

### Useful Monitoring Commands

```bash
# Check Geth sync status
geth attach http://localhost:8545 --exec "eth.syncing"

# Check Lighthouse sync status
curl -s http://localhost:5052/eth/v1/node/syncing | jq

# Check validator status
curl -s http://localhost:5052/eth/v1/beacon/states/head/validators/0x... | jq

# Check peer count
geth attach --exec "admin.peers.length"
curl -s http://localhost:5052/eth/v1/node/peers | jq '.data | length'
```

## Archive Node Configuration

```bash
# Geth archive mode
ExecStart=/usr/local/bin/geth \
  --mainnet \
  --datadir /var/lib/geth \
  --gcmode archive \
  --syncmode full \
  # ... other flags

# Erigon (optimized for archive)
ExecStart=/usr/local/bin/erigon \
  --datadir /var/lib/erigon \
  --chain mainnet \
  --prune=htc \
  # ... other flags
```

## Process Integration

| Process | Purpose |
|---------|---------|
| `blockchain-node-setup.js` | Node deployment |
| `validator-node-operation.js` | Validator setup |
| `blockchain-indexer-development.js` | Indexing infrastructure |

## Best Practices

1. Use checkpoint sync for faster initial sync
2. Monitor disk space (archive nodes need TBs)
3. Set up alerting for missed attestations
4. Keep clients updated
5. Use separate machines for execution and consensus
6. Backup validator keys securely

## See Also

- `agents/blockchain-infra/AGENT.md` - Infrastructure expert
- [Ethereum.org Staking](https://ethereum.org/staking)
- [EthStaker](https://ethstaker.cc/)
