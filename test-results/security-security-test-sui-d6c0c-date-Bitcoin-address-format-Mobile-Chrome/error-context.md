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
  - tab "P2P Network"
  - tab "Message Composer"
  - tab "Proof-of-Work Demo" [selected]
  - tab "Identity Manager"
  - tab "Enterprise"
  - tab "Profile"
- tabpanel "Proof-of-Work Demo":
  - heading "Experience Bitcoin's Anti-Spam Power" [level=2]
  - paragraph: See how requiring computational work for each message makes spam economically impossible while keeping legitimate communication free and instant.
  - heading "Bitcoin-Style Proof-of-Work Demo" [level=3]:
    - img
    - text: Bitcoin-Style Proof-of-Work Demo
  - paragraph: Experience how BitComm uses Bitcoin's SHA-256 hashing to prevent spam
  - text: Message Content
  - textbox "Message Content": Hello, this is my first BitComm message!
  - text: "Difficulty Level: 4 (requires 65,536 expected hashes)"
  - slider
  - text: Easy (3) Moderate (4-5) Hard (6)
  - button "Compute Proof-of-Work":
    - img
    - text: Compute Proof-of-Work
```