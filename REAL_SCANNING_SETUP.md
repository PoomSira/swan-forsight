# Real Vulnerability Scanning - Setup Checklist

## Understanding Your Files

| Your File                         | Usage                                  | Adapted For                            |
| --------------------------------- | -------------------------------------- | -------------------------------------- |
| `Fox_ess_fast_scanner.py`         | Block-based Modbus register reading    | ✅ **Core of Lambda scanner**          |
| `Fox_ess_live_monitoring.py`      | Continuous monitoring + cloud API post | ✅ Inspiration for metrics calculation |
| `Fox_ess_monitoring_live_2026.py` | Final version with CSV logging         | Reference for register mapping         |

## How FoxESS Scanner Became Vulnerability Scanner

```
Fox_ess_fast_scanner.py          →    lambda_scanner.py
┌─────────────────────────────┐    ┌──────────────────────────┐
│ read_register_block()       │    │ scan_register_range()    │
│ - Reads 50 registers at once│    │ - Scans blocks of 50     │
│ - Try holding registers    │    │ - Detects accessible     │
│ - Fallback to input regs   │    │ - Tests for writability  │
│ - Handle errors gracefully │    │ - Records findings       │
│ - Sleep between requests   │    │ - Same pattern!          │
└─────────────────────────────┘    └──────────────────────────┘
         ↓                                    ↓
    Specific to FoxESS             Generic Modbus Scanner
    Device IP: 192.168.11.81       Any IP + Vulnerability Findings
    Output: CSV                    Output: JSON + CVSS Scores
```

## Quick 5-Minute Setup

### Phase 1: Test Locally (2 minutes)

```bash
cd scanner-lambda
pip install -r requirements.txt
python3 lambda_scanner.py 192.168.11.81
```

Expected:

```
[20%] Starting vulnerability scan
[30%] Scanning holding registers (0-2000)...
✓ HOLDING 0-49: Found 15 readable
[100%] ✅ Scan complete
```

### Phase 2: Deploy to Lambda (2 minutes)

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create role
aws iam create-role \
  --role-name lambda-modbus-scanner-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policy
aws iam attach-role-policy \
  --role-name lambda-modbus-scanner-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Deploy
./deploy.sh
cd build && aws lambda create-function \
  --function-name modbus-vulnerability-scanner \
  --runtime python3.11 \
  --role arn:aws:iam::${AWS_ACCOUNT_ID}:role/lambda-modbus-scanner-role \
  --handler lambda_scanner.lambda_handler \
  --zip-file fileb://lambda_function.zip \
  --timeout 300 --memory-size 1024

# Enable Function URL
aws lambda create-function-url-config \
  --function-name modbus-vulnerability-scanner \
  --auth-type NONE
```

Copy the returned `FunctionUrl`

### Phase 3: Connect to Next.js (1 minute)

```bash
# In .env.local
echo "AWS_LAMBDA_SCANNER_URL=https://YOUR_FUNCTION_URL_HERE" >> .env.local

# Restart dev server
npm run dev
```

### Phase 4: Test from UI (1 minute)

1. Open http://localhost:3000/vulnerability-scan
2. Select target asset
3. Click Execute
4. View real vulnerability findings ✅

## Two Deployment Options

### Option A: AWS Lambda (Recommended for Production)

```
Next.js → AWS Lambda (runs scanner) → Your Modbus Device
         (requires internet + proper IAM)
```

**Pros:**

- ✅ Serverless (no server to maintain)
- ✅ Scales automatically
- ✅ Pay per scan ($0.002-0.01)

**Cons:**

- ⚠️ Device must be on public network OR
- ⚠️ Lambda must be in VPC with access

### Option B: Local Scanner (Best for Testing)

```
Next.js → Splashtop Server (runs scanner) → Your Modbus Device
         (internal network, direct access)
```

**To use local:**

1. Copy scanner to Splashtop server:

```bash
scp -r scanner-lambda user@splashtop:/home/user/
```

2. Create `app.py` on server:

```python
from fastapi import FastAPI
from lambda_scanner import lambda_handler
import json

app = FastAPI()

@app.post("/scan")
async def scan(target_ip: str):
    result = lambda_handler({"target_ip": target_ip}, None)
    return json.loads(result["body"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

3. Start on server:

```bash
pip install fastapi uvicorn
python3 app.py
```

4. Update `.env.local`:

```env
AWS_LAMBDA_SCANNER_URL=http://your-server-ip:8000/scan
```

## Files Created

```
scanner-lambda/
├── lambda_scanner.py       ← Main vulnerability scanner (adapted from FoxESS)
├── requirements.txt        ← Python dependencies
├── deploy.sh              ← AWS deployment script
└── README.md              ← Full documentation

app/api/vulnerability-scan/route.ts
    ↑ Updated to call real Lambda instead of mock simulation
```

## Expected Results in UI

### Before (Mock/Simulation)

```
Execution Log:
- 30% Starting...
- 50% [Generic message]
- 100% Completion

Findings:
- [Mock hardcoded findings]
```

### After (Real Scanning)

```
Execution Log:
- 20% Connecting to 192.168.11.81
- 30% Scanning holding registers (0-2000)...
- Scanning input registers (0-2000)...
- Scanning coils...
- 100% ✅ Scan complete

Findings:
✗ CRITICAL: Writable Modbus Registers Detected (CVSS 9.8)
⚠ HIGH: Unauthenticated Modbus Access (CVSS 7.5)
⚠ MEDIUM: Data Exposure: 156 Readable Registers (CVSS 5.3)
```

## Verification Checklist

- [ ] Local test passed: `python3 lambda_scanner.py 192.168.11.81`
- [ ] Lambda deployed successfully
- [ ] Function URL created and copied
- [ ] `.env.local` updated with `AWS_LAMBDA_SCANNER_URL`
- [ ] Next.js restarted: `npm run dev`
- [ ] Vulnerability scan page loads without errors
- [ ] Execute button triggers real scan
- [ ] Real findings appear in UI

## Troubleshooting

**Q: "Failed to connect to device"**
A: Lambda is running in AWS, may not have network access. Try local option or deploy Lambda in VPC.

**Q: "AWS_LAMBDA_SCANNER_URL not configured"**
A: Add to `.env.local` and restart: `npm run dev`

**Q: Deploy script permission error**
A: `chmod +x deploy.sh`

**Q: Python imports not working**
A: Make sure `requirements.txt` installed: `pip install -r requirements.txt`

## How It Relates to Your Other Python Scripts

- **`Fox_ess_fast_scanner.py`**: Direct ancestor of `scan_register_range()` method
- **`Fox_ess_live_monitoring.py`**: Shows how to parse & display Modbus data (could integrate findings back)
- **Your telemetry `/api/energy`**: Scanner can now validate that same device is accessible + vulnerable

## Next Steps After Setup

1. ✅ Real scanning working
2. Future: Store scan results in database (create `modbus_scans` table)
3. Future: Schedule periodic scans via Lambda EventBridge
4. Future: Create scan history/trending dashboard
5. Future: Integrate with asset management (correlate scans with tracked assets)

---

**Questions?** Check `scanner-lambda/README.md` for detailed docs.
