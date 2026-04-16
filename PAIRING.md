### Session #1:
TODO:
1. install [Node](https://nodejs.org/dist/v24.13.0/node-v24.13.0-x64.msi)
2. in console
  - `npm i`
 
Concepts:
- truthy
- data models
- abstraction
- encapsulation

### Session #2:
TODO: 
1. install [aws cli](https://awscli.amazonaws.com/AWSCLIV2.msi)

Concepts:
- three tier application architecture
  - view
  - business logic
  - data access 
  - singleton
- the difference between JavaScript and TypeScript

### Session #3:
TODO:
1. Move form into Component, create new account Component, conditionally show on auth.
2. Consolidate theme color css

Concepts:
Systems do work over time → work can fail → failures need safe retry → safe retry needs atomic primitives.
- Asynchronous vs synchronous (promises, futures)
  - synchronous can freeze or delay the UI (see async appointment and service load)
  - asynchronous good for parallel operations or "tell me later"
- Typing (JS vs TS)
  In untyped JavaScript, a variable can hold any value, which can lead to runtime issues. For example, if a variable 
  named toDate is assigned a string and later the code expects it to be a date and tries calling toDate.minutes(), the 
  program will throw an error because .minutes() doesn’t exist on strings.
  The main advantage some people mention for untyped languages is flexibility — sometimes it’s useful for a variable to 
  hold different types of values, such as when a function’s return type depends on context. But in general, typed 
  languages are better because they help prevent runtime errors.
  With TypeScript, if there’s a type mismatch, the code won’t even run or compile. TypeScript’s type system is 
  particularly powerful: if you declare a variable as string, it can’t accidentally become null, eliminating common null 
  pointer or undefined errors that often cause crashes in JavaScript and other languages.
- Error handling. See TODO on AppointmentService.create() loop in +page.svelte. What can happen if we leave it as is
- Idempotency (specifically using upsert, but it's a general concept)
  Operation that can be applied multiple times with same input and produces same result. First call may
  change state, subsequent identical calls have no additional effect. Essential for safe retries
  (ex: GET /user/123, DELETE /order/456).
  Amplify Alternative (ensureVehicle() pattern): Manual upsert via list-then-create-or-return
  - LIST by unique fields (year/make/model)
  - If found → return existing ID
  - If not found → CREATE and return new ID
  Pro: Simple, explicit, teaches data flow
  Con: Two round trips, theoretical race condition (two users creating same vehicle simultaneously)
  What happens if user double-clicks submit? What if network drops halfway through vehicle lookup?
- Upsert - "Update or Insert": Database operation that automatically updates existing record if it matches a key, 
    or inserts new record if no match exists. Single atomic operation (ex: UPSERT INTO table VALUES (...) or 
    ON CONFLICT UPDATE). Solves "check-then-act" race condition.
- Database relationships (one to many, many to many, foreign key, normalization)
  - Foreign key
    - A column in one table that points to the primary key of another table
  - One to one
    - Customer: |id|
    - CustomerProfile: |id | Customer_id (unique constraint)|
    - If more than one row in CustomerProfile had the same Customer_id, it would become many to one
  - One to many
    - Customer: |id|
    - Appointment: |id | Customer_id|
    - One customer can have many appointments
  - Many to many
    - Appointment: |id|
    - AppointmentServices: |id | Appointment_id | Service_id|
    - Service: |id|
    - AppointmentServices is the join table that stores the actual relationships between appointments and services
  - Normalization
    - Store reusable data once, then reference it by ID instead of copying it into many rows
    - Example: keep service definitions in `Service`, and use `AppointmentServices` to link them to appointments




ME: part of why is this im using this project to teach my son coding. i wanted to get some stuff done so he didn't have to go through drudgery of figure out the initial stuff. i can walk him through the pattern and why to do things certain ways, and then work on the other pages with him

AI: 
That’s a very good reason to do it this way. What you’re describing is basically scaffolding with worked examples: you remove the low-value startup friction, establish a solid pattern, and then use that pattern to teach reasoning, structure, and tradeoffs on the next pages. Educational research on novice programming consistently finds that scaffolding, modeling, and worked examples reduce overload and let learners focus on the concepts that matter.

Why this is smart
You are not “robbing him of learning”; you’re curating which learning happens. If he had to grind through every initial wiring decision, he’d spend energy on framework friction and incidental complexity instead of understanding form flow, validation, async behavior, persistence, and UI patterns. Scaffolding works best when you provide support up front and then let the learner gradually take over more of the work.

Best teaching pattern
A strong pattern here is use-modify-create:

Use: Walk him through the finished appointment flow and explain the moving parts.

Modify: Have him adapt the pattern for a related page, maybe customer notes, vehicle editing, or appointment review.

Create: Let him build a new page with the same conventions but less direct guidance.

Worked-example and project-based-learning research both support this kind of progression because it builds confidence while still forcing real understanding and transfer.

Pairing approach
This also maps well to parent-child pair programming: one of you can be the driver and the other the navigator, and you can switch roles as he gains confidence. Pair programming is especially useful on multi-part projects because it reduces overwhelm, encourages explanation, and helps a learner see not just what code is written but why it is written that way.

My take
Honestly, this is one of the best uses of a real project. He gets authenticity, you get to encode good engineering instincts early, and the “why” behind patterns becomes teachable because the code solves a real business problem instead of a toy exercise. That is exactly the kind of scaffolding I’d recommend.

One thing I’d suggest: as you hand pages to him, narrate the tradeoffs explicitly — “this is good enough for a small-business app,” “this is where enterprise systems would differ,” “this is where we intentionally chose simplicity.” That kind of judgment is the real gold.


But science says it's 80% grit.
Angela Duckworth tested thousands: grit predicts success better than IQ.