export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fin-Bot - Telegram Expense Tracker</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; color: white; margin-bottom: 40px; }
        .header h1 { font-size: 3rem; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .status { background: rgba(255,255,255,0.95); border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .status-indicator { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .status-dot { width: 12px; height: 12px; background: #4CAF50; border-radius: 50%; margin-right: 10px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        .guide { background: rgba(255,255,255,0.95); border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .guide h2 { color: #667eea; margin-bottom: 20px; font-size: 2rem; }
        .commands { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .command-card { background: #f8f9fa; border-radius: 10px; padding: 20px; border-left: 4px solid #667eea; }
        .command-card h3 { color: #667eea; margin-bottom: 10px; }
        .command-card code { background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; }
        .quick-start { background: linear-gradient(45deg, #4CAF50, #45a049); color: white; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .quick-start h3 { margin-bottom: 15px; }
        .quick-start ol { margin-left: 20px; }
        .quick-start li { margin-bottom: 8px; }
        .footer { text-align: center; color: white; margin-top: 40px; opacity: 0.8; }
        .footer a { color: #fff; text-decoration: none; font-weight: bold; }
        .footer a:hover { text-decoration: underline; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .feature { background: rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; color: white; text-align: center; }
        .feature h3 { margin-bottom: 10px; color: #fff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Fin-Bot</h1>
            <p>Your Personal Telegram Expense Tracker</p>
        </div>

        <div class="status">
            <div class="status-indicator">
                <div class="status-dot"></div>
                <h2>Bot is Running Successfully!</h2>
            </div>
            <p style="text-align: center; color: #666;">Serverless deployment active - Ready for instant responses!</p>
        </div>

        <div class="features">
            <div class="feature">
                <h3>📊 Smart Tracking</h3>
                <p>Track expenses with simple messages like "100 Grocery"</p>
            </div>
            <div class="feature">
                <h3>📈 Budget Management</h3>
                <p>Set budgets and monitor remaining amounts</p>
            </div>
            <div class="feature">
                <h3>📋 Export Data</h3>
                <p>Export your data as CSV files</p>
            </div>
            <div class="feature">
                <h3>🔍 Category Filter</h3>
                <p>Filter and analyze by categories</p>
            </div>
        </div>

        <div class="guide">
            <h2>🚀 How to Use Fin-Bot</h2>
            
            <div class="quick-start">
                <h3>Quick Start Guide:</h3>
                <ol>
                    <li>Start a chat with your Fin-Bot on Telegram</li>
                    <li>Send <code>/start</code> to initialize the bot</li>
                    <li>Add expenses by typing: <code>100 Grocery</code></li>
                    <li>Use commands below to manage your expenses</li>
                </ol>
            </div>

            <div class="commands">
                <div class="command-card">
                    <h3>Basic Commands</h3>
                    <p><code>/start</code> - Initialize the bot</p>
                    <p><code>/instructions</code> - Show all commands</p>
                </div>

                <div class="command-card">
                    <h3>Add Expenses</h3>
                    <p><code>100 Grocery</code> - Add expense entry</p>
                    <p>Format: <code>[amount] [description]</code></p>
                </div>

                <div class="command-card">
                    <h3>View Entries</h3>
                    <p><code>/view</code> - Show last 20 entries</p>
                    <p><code>/lastentry</code> - Show latest entry</p>
                </div>

                <div class="command-card">
                    <h3>Manage Entries</h3>
                    <p><code>/removelastentry</code> - Delete last entry</p>
                    <p><code>/category Food</code> - Filter by category</p>
                </div>

                <div class="command-card">
                    <h3>Budget Control</h3>
                    <p><code>/setbudget 5000</code> - Set monthly budget</p>
                    <p>Automatically calculates remaining amount</p>
                </div>

                <div class="command-card">
                    <h3>Reports & Export</h3>
                    <p><code>/export</code> - Download CSV file</p>
                    <p><code>/summary daily</code> - Get expense summary</p>
                </div>

                <div class="command-card">
                    <h3>Split Expenses</h3>
                    <p><code>/split 200 Dinner @user1:100 @user2:100</code></p>
                    <p>Split expenses among multiple users</p>
                </div>

                <div class="command-card">
                    <h3>Summary Options</h3>
                    <p><code>/summary weekly</code> - Weekly report</p>
                    <p><code>/summary monthly</code> - Monthly report</p>
                    <p><code>/summary custom 2024-01-01 2024-01-31</code></p>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Created with ❤️ by <a href="https://github.com/sahilmandre" target="_blank">Sahil Mandre</a></p>
            <p><a href="https://github.com/sahilmandre/fin-bot-new" target="_blank">View Source Code</a></p>
        </div>
    </div>
</body>
</html>
  `);
}