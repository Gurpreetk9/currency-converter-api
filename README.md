# Introduction
The "Currency Converter" project aims to develop a web and mobile application that allows users to convert currencies using real-time exchange rates. Users will be able to track historical rates, save favorite currency pairs, and set notifications for specific rate changes.

# Objectives
* Allow users to create accounts, save currency pairs, and set notifications.

* Provide accurate real-time exchange rates for a wide range of currencies.

* Enable users to track historical exchange rate data.

* Support users in setting rate alerts and receiving updates via notifications.

# User Stories
1.  As a user, I want to sign up for an account so that I can save my favorite currency pairs.

2.  As a user, I want to convert one currency to another using real-time exchange rates.

3.  As a user, I want to reverse the currency pair for quick conversion.

4.  As a user, I want to see historical exchange rate trends to analyze the performance of currencies over time.

5.  As a user, I want to save my most frequently used currency pairs for fast access.

6.  As a user, I want to receive alerts when a currency reaches a specific rate.

7.  As a user, I want to receive daily updates on exchange rates to stay informed.

# API Endpoints

## User Management
* POST /signup: Register a new user.

* POST /login: Authenticate a user.

* GET /profile: Get user profile details.

* PUT /profile: Update user profile and preferences.

## Currency Conversion
* GET /convert: Convert an amount from one currency to another using real-time rates.

* GET /reverse: Reverse the currency pair for a new conversion.

## Historical Data
* GET /historical: Get historical exchange rate data for a specified date range.

## Favorite Currency Pairs
* POST /favorites: Save a favorite currency pair.

* GET /favorites: Retrieve saved currency pairs.

## Notifications and Alerts
* POST /alerts: Set a rate alert for a currency pair.

* GET /alerts: Retrieve active rate alerts.
