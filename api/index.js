export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
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
        .guide { background: rgba(255,255,255,0.95); border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-bottom: 30px; }
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
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { padding: 12px; text-align: left; border: 1px solid #ddd; background: #667eea; color: white; }
        td { padding: 10px; border: 1px solid #ddd; }
        tr:nth-child(even) { background: #f8f9fa; }
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
            <p style="text-align: center; color: #666;">Ready to track your expenses via Telegram</p>
        </div>

        <div class="features">
            <div class="feature">
                <h3>� Sumart Tracking</h3>
                <p>Track expenses with simple messages like "100 Grocery"</p>
            </div>
            <div class="feature">
                <h3>�  Budget Management</h3>
                <p>Set monthly budgets and check remaining amounts in real-time</p>
            </div>
            <div class="feature">
                <h3>�  Month Comparison</h3>
                <p>Compare spending between months to spot trends</p>
            </div>
            <div class="feature">
                <h3>📋 Export & Reports</h3>
                <p>Export monthly data as CSV with category breakdowns</p>
            </div>
            <div class="feature">
                <h3>👥 Multi-User Support</h3>
                <p>Use in personal chats or groups for shared expenses</p>
            </div>
            <div class="feature">
                <h3>🔍 Category Analysis</h3>
                <p>Filter and analyze spending by categories</p>
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
                    <h3>🚀 Getting Started</h3>
                    <p><code>/start</code> - Initialize the bot</p>
                    <p><code>/instructions</code> - Show all commands</p>
                    <p style="margin-top: 10px; color: #666; font-size: 0.9em;">Start here to set up your bot</p>
                </div>

                <div class="command-card">
                    <h3>➕ Add Expenses</h3>
                    <p><code>100 Grocery</code> - Add expense</p>
                    <p><code>50 Coffee</code> - Quick entry</p>
                    <p><code>1500 Rent</code> - Any amount</p>
                    <p style="margin-top: 10px; color: #666; font-size: 0.9em;">Format: [amount] [description]</p>
                </div>

                <div class="command-card">
                    <h3>👀 View Expenses</h3>
                    <p><code>/view</code> - Last 20 entries</p>
                    <p><code>/lastentry</code> - Latest entry</p>
                    <p><code>/category Food</code> - Filter by category</p>
                    <p style="margin-top: 10px; color: #666; font-size: 0.9em;">See your spending history</p>
                </div>

                <div class="command-card">
                    <h3>✏️ Manage Entries</h3>
                    <p><code>/removelastentry</code> - Delete last entry</p>
                    <p style="margin-top: 10px; color: #666; font-size: 0.9em;">Made a mistake? Remove it easily</p>
                </div>

                <div class="command-card">
                    <h3>💰 Budget Tracking</h3>
                    <p><code>/setbudget 5000</code> - Set monthly budget</p>
                    <p><code>/remaining</code> - Check remaining budget</p>
                    <p style="margin-top: 10px; color: #666; font-size: 0.9em;">Stay on track with your budget</p>
                </div>

                <div class="command-card">
                    <h3>📊 Export & Reports</h3>
                    <p><code>/export</code> - Export current month</p>
                    <p><code>/export Nov</code> - Export November</p>
                    <p><code>/export October</code> - Full month name</p>
                    <p style="margin-top: 10px; color: #666; font-size: 0.9em;">Download CSV files for analysis</p>
                </div>

                <div class="command-card">
                    <h3>📈 Compare & Analyze</h3>
                    <p><code>/compare Oct Nov</code> - Compare months</p>
                    <p><code>/summary daily</code> - Daily summary</p>
                    <p><code>/summary weekly</code> - Weekly summary</p>
                    <p><code>/summary monthly</code> - Monthly summary</p>
                    <p style="margin-top: 10px; color: #666; font-size: 0.9em;">Analyze spending patterns</p>
                </div>

                <div class="command-card">
                    <h3>👥 Group Expenses</h3>
                    <p><strong>Track shared expenses with friends!</strong></p>
                    <p>1. Create a Telegram group</p>
                    <p>2. Add this bot to the group</p>
                    <p>3. Everyone can add/view expenses</p>
                    <p style="margin-top: 10px; color: #667eea; font-weight: bold;">Perfect for roommates, families, or teams!</p>
                </div>

                <div class="command-card">
                    <h3>🎯 Advanced Features</h3>
                    <p><code>/summary custom 2024-01-01 2024-01-31</code></p>
                    <p style="margin-top: 5px;">Custom date range summaries</p>
                    <p style="margin-top: 10px;"><code>/category Groceries</code></p>
                    <p style="margin-top: 5px;">Filter by specific categories</p>
                    <p style="margin-top: 10px; color: #666; font-size: 0.9em;">Power user features</p>
                </div>
            </div>
        </div>

        <div class="guide">
            <h2>📋 Complete Command Reference</h2>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Command</th>
                            <th>Description</th>
                            <th>Example</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>/start</code></td>
                            <td>Initialize the bot</td>
                            <td><code>/start</code></td>
                        </tr>
                        <tr>
                            <td><code>/instructions</code></td>
                            <td>Show all available commands</td>
                            <td><code>/instructions</code></td>
                        </tr>
                        <tr>
                            <td><code>[amount] [description]</code></td>
                            <td>Add a new expense</td>
                            <td><code>100 Grocery</code></td>
                        </tr>
                        <tr>
                            <td><code>/view</code></td>
                            <td>View last 20 entries</td>
                            <td><code>/view</code></td>
                        </tr>
                        <tr>
                            <td><code>/lastentry</code></td>
                            <td>View the last entry</td>
                            <td><code>/lastentry</code></td>
                        </tr>
                        <tr>
                            <td><code>/removelastentry</code></td>
                            <td>Remove the last entry</td>
                            <td><code>/removelastentry</code></td>
                        </tr>
                        <tr>
                            <td><code>/setbudget</code></td>
                            <td>Set monthly budget</td>
                            <td><code>/setbudget 5000</code></td>
                        </tr>
                        <tr>
                            <td><code>/remaining</code></td>
                            <td>Check remaining budget for current month</td>
                            <td><code>/remaining</code></td>
                        </tr>
                        <tr>
                            <td><code>/export</code></td>
                            <td>Export month transactions as CSV</td>
                            <td><code>/export</code> or <code>/export Nov</code></td>
                        </tr>
                        <tr>
                            <td><code>/compare</code></td>
                            <td>Compare spending between two months</td>
                            <td><code>/compare Oct Nov</code></td>
                        </tr>
                        <tr>
                            <td><code>/category</code></td>
                            <td>Filter spending by category</td>
                            <td><code>/category Food</code></td>
                        </tr>
                        <tr>
                            <td><code>/summary</code></td>
                            <td>Get expense summary</td>
                            <td><code>/summary daily</code></td>
                        </tr>
                    </tbody>
                </table>
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
