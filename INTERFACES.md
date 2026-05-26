# Interfaces & the Repository Pattern

## The problem we're solving
- The scheduling page talks directly to AWS Amplify/DynamoDB
- If Jay ever moves off AWS, every file that touches data needs to change
- We want to isolate that change to one place

## What an interface is
- A contract: "anyone who wants to be a CustomerRepository must have these methods"
- The interface doesn't care *how* it's implemented — just *what* it can do
- `types.ts` — show this file. No AWS imports anywhere. A Postgres dev could read this and implement it.

## The repository pattern
- One file per model, wraps all the data access for that model
- Routes/actions never call Amplify directly — they go through the repository
- `amplify/appointmentRepository.ts` — show the `toAppointment()` mapper. This is the seam between "their types" and "our types."

## The swap point
- `index.ts` — this is the only file any route imports
- To migrate to Postgres: write `postgres/appointmentRepository.ts`, change one import line here
- Nothing else in the app changes

## Why this matters beyond AWS
- Same pattern applies to any external dependency: payment providers, email services, SMS
- Makes testing easier too — you can swap in a fake implementation that returns hardcoded data

## The tradeoff
- More files upfront
- But each file is small and obvious
- The cost of *not* doing it is rewriting every route when you migrate