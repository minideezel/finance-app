### Overview
This application will function as a way to showcase the loan ammoritization of a mortgage, with specific features to handle one-time payments, extra payments, and arm loans that have interest rate changes each year. 

### Features
- Clean modern interface with tailwind
- Single html page app
- utilize browser localstorage to save all of the data so you don't have to reenter it again
- show a graph of loan amount over time
- loan ammoitization table at the bottom

### Loan details
- inputs for Start date, amount, starting interest rate, # of years of fixed interest rate
- a place to add interest rate change times (for example, add a new rate change, enter 5 years as the timeframe from loan start, and then put in a new interest rate, assume that rate for the rest of the loan or until another rate change point was added)
- A way to add one time payments
- A way to input a dollar amount that will be paid extra each month starting from today (assume minimum for what was paid up to today)


### Outputs
- Full cost of the loan with interest
- Amount of interest paid
- Loan payoff time (both absolulte date and number of years/mos)
- Time and interested saved by doing a 1-time payment or paying extra per month

### Loan graph
- Original Loan principal over time (after including the interest rate changes)
- Projected loan principal with given one-time payments and monthly extra
- ability to move mouse over the graph to get the numbers for those given points

