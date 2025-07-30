# Page snapshot

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
- banner:
  - img
  - heading "BitComm" [level=1]
  - button "Sign In"
- tablist:
  - tab "P2P Network" [selected]
  - tab "Message Composer"
  - tab "Proof-of-Work Demo"
  - tab "Identity Manager"
  - tab "Enterprise"
  - tab "Profile"
- tabpanel "P2P Network":
  - heading "P2P Network Layer" [level=2]
  - paragraph: Connect to the decentralized BitComm network. No central servers, just peer-to-peer communication with Bitcoin-level security.
  - heading "P2P Network Status" [level=3]:
    - img
    - text: P2P Network Status
  - paragraph: BitComm decentralized networking layer status and statistics
  - text: Disconnected
  - paragraph: "Peer ID: Not connected"
  - button "Start P2P Network":
    - img
    - text: Start P2P Network
```