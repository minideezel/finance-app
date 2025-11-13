# Finance App

A collection of financial calculators and tools to help with personal finance decisions.

## Tools

### ARM Loan Forecaster
Calculate and visualize adjustable-rate mortgage amortization with custom payment scenarios.

**Features:**
- Adjustable-rate mortgage (ARM) calculations with interest rate changes over time
- One-time extra payment support
- Recurring extra monthly payment support
- Interactive loan balance graph showing original vs. modified scenarios
- Detailed amortization schedule table
- Savings calculator showing interest and time saved
- Automatic data persistence using browser localStorage

## Getting Started

1. Open `index.html` in your browser
2. Select a tool to use
3. All data is automatically saved in your browser

## Project Structure

```
finance-app/
├── index.html                          # Main landing page
├── README.md                           # This file
├── assets/                             # Shared assets (for future use)
└── tools/                              # Individual tools
    └── arm-loan-forecaster/           # ARM Loan Forecaster tool
        ├── index.html                 # Tool UI
        └── app.js                     # Tool logic
```

## Technologies Used

- HTML5
- Tailwind CSS (via CDN)
- JavaScript (ES6+)
- Chart.js for data visualization
- localStorage for data persistence

## Adding New Tools

To add a new tool to this repository:

1. Create a new folder under `tools/`
2. Add your tool's HTML and JavaScript files
3. Update the main `index.html` to include a link to your new tool

## License

MIT
