# GarageOS

> The Operating System for Automotive Ownership.

GarageOS is a platform for automotive enthusiasts to manage, document, showcase, and preserve everything related to their vehicles, garages, projects, tools, and ownership history.

Whether you own a completely stock daily driver, a weekend track car, a drift build, a restoration project, or an entire collection, GarageOS provides a single place to manage it all.

## Local Setup (Step-by-Step)

These steps get GarageOS running locally with all required dependencies.

### 1. Install dependencies on your machine

Required:

* Node.js (LTS recommended, includes npm)
* PostgreSQL (17+ recommended)
* Git

Windows install examples:

```powershell
winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
winget install PostgreSQL.PostgreSQL.17 --accept-source-agreements --accept-package-agreements
```

Verify installs:

```powershell
node --version
npm --version
```

Note for PowerShell on some Windows machines:

* If script execution blocks `npm`, use `npm.cmd` instead.

### 2. Clone and enter the project

```powershell
git clone https://github.com/robinofverberg/GarageOS.git
cd GarageOS
```

### 3. Install project packages

```powershell
npm.cmd install
```

### 4. Create the local database

Create a database named `garageos`:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U postgres -h localhost garageos
```

If prompted, enter your PostgreSQL password.

### 5. Configure environment variables

Create a `.env` file in the project root with:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/garageos?schema=public"
```

Replace `YOUR_POSTGRES_PASSWORD` with your real PostgreSQL password.

### 6. Apply database migrations

```powershell
npm.cmd run db:migrate
```

### 7. Seed demo data

```powershell
npm.cmd run db:seed
```

### 8. Start the development server

```powershell
npm.cmd run dev
```

Open the app at:

* http://localhost:3000

### 9. Manual test routes

* /
* /garage
* /garage/new
* /vehicle/[id]

### Troubleshooting

* `prisma is not recognized`: run `npm.cmd install` again.
* Port 3000 already in use: stop the other Next.js process or use the alternate port shown in terminal.
* Database auth errors: verify your `DATABASE_URL` password and PostgreSQL service status.

---

## Why GarageOS?

Car enthusiasts currently split their data across dozens of platforms:

* Instagram for photos
* Notes apps for maintenance logs
* Excel sheets for expenses
* Forums for build threads
* Marketplaces for buying and selling parts
* Memory for everything else

GarageOS combines all of these into one platform.

Your garage.
Your vehicles.
Your projects.
Your data.

All in one place.

---

# Vision

Our goal is simple:

**If your garage disappeared tomorrow, GarageOS should contain everything that mattered.**

GarageOS is designed to become the digital home of automotive ownership.

Not just another maintenance tracker.

Not just another social network.

Not just another build thread website.

GarageOS is the complete operating system for automotive enthusiasts.

---

# Core Platform

Every user owns a digital garage.

Inside that garage they can manage:

* Vehicles
* Maintenance records
* Modifications
* Build histories
* Photos
* Expenses
* Tools
* Spare parts
* Projects
* Community profiles
* Rankings
* Marketplace listings

---

# Feature Roadmap

## Vehicle Profiles

Every vehicle receives a dedicated profile page.

### Vehicle Information

* Make
* Model
* Year
* Engine
* Transmission
* Registration Number
* VIN (Optional)
* Color
* Horsepower
* Torque
* Mileage

### Dashboard Statistics

* Current Mileage
* Ownership Duration
* Total Modifications
* Total Maintenance Events
* Total Money Invested
* Community Rating
* GarageOS Build Score

---

## Vehicle Timeline

A complete timeline of ownership.

Example:

### 2025

* Purchased Vehicle

### 2025

* Oil Change
* 152,000 km

### 2025

* Installed Style 66 Wheels

### 2026

* Installed BC Racing Coilovers

### 2026

* M5 Front Bumper Conversion

### 2026

* Engine Rebuild

Every modification, service event, repair, and upgrade becomes part of the vehicle's history.

---

## Modification Tracking

Track every modification installed on a vehicle.

Examples:

### Wheels

* Brand
* Model
* Offset
* Tire Size

### Suspension

* Brand
* Product
* Installation Date

### Exhaust

* Manufacturer
* Product
* Cost

### Engine Upgrades

* Parts
* Tuning Information
* Dyno Results

Each modification includes:

* Photos
* Cost
* Notes
* Purchase Information
* Installation Date

---

## Interactive Photo Tagging

Users can tag parts directly on vehicle photos.

Example:

A wheel can be tagged on an uploaded image.

Clicking the wheel tag opens:

* Manufacturer
* Model
* Dimensions
* Cost
* Installation Date
* Related Photos

Supported Tags:

* Wheels
* Tires
* Suspension
* Exhaust
* Body Kits
* Lighting
* Interior Components
* Engine Components

---

## Build Cards

Every vehicle automatically receives a public Build Card.

Think of it as a profile page for the vehicle itself.

A Build Card contains:

* Hero Photo
* Specifications
* Modification List
* Ownership Timeline
* Community Rating
* Build Score
* Cost Statistics
* Photo Gallery
* Build Updates

Example URL:

garageos.com/build/e39-540i-mystic-blue

### Shareability

Build Cards can be shared on:

* Instagram
* Reddit
* Facebook Groups
* Forums
* Discord

### QR Codes

Every Build Card can generate a QR code.

Owners can place the QR code:

* In the engine bay
* On display stands
* At car shows
* At meets

Visitors can instantly view the full build.

---

## Garage Management

### Tool Inventory

Track all garage tools.

Examples:

* Torque Wrenches
* Socket Sets
* Jacks
* Jack Stands
* Impact Guns
* Diagnostic Equipment

Tool Data:

* Brand
* Purchase Date
* Purchase Price
* Notes
* Storage Location

---

### Wishlist

Track future purchases.

Examples:

* New Wheels
* Lift Kit
* Tool Chest
* Engine Hoist

Features:

* Estimated Cost
* Priority Level
* Purchase Links

---

### Spare Parts Inventory

Track consumables and spare parts.

Examples:

* Oil Filters
* Brake Pads
* Spark Plugs
* Sensors
* Fluids

Features:

* Stock Quantity
* Compatible Vehicles
* Purchase History
* Low Stock Alerts

---

## Community

### Rate My Car

Users can submit vehicles for community ratings.

Categories:

* OEM
* OEM+
* Street
* Show Car
* Track Car
* Drift Car
* Rally Car
* Restomod

Features:

* Ratings
* Comments
* Favorites
* Followers

---

### User Profiles

Public enthusiast profiles.

Includes:

* Garage
* Vehicles
* Projects
* Ratings
* Achievements
* Followers

---

### Build Journals

Project threads documenting a vehicle over time.

Examples:

* E39 Restoration
* Supra Build
* Drift Project

Each update can contain:

* Photos
* Videos
* Costs
* Notes
* Milestones

---

## Rankings & Leaderboards

### Global Rankings

Top 50 Vehicles Worldwide

### Regional Rankings

Top 50 By:

* Country
* State
* City

### Manufacturer Rankings

Top 50:

* BMW
* Audi
* Volvo
* Toyota
* Nissan
* Honda

### Category Rankings

Top 50:

* Daily Drivers
* Show Cars
* Drift Cars
* Track Cars
* Restorations

---

## Analytics

### Cost Tracking

Automatically calculate:

* Maintenance Costs
* Modification Costs
* Fuel Costs
* Repair Costs

Display:

* Monthly Spending
* Annual Spending
* Lifetime Spending

---

### Vehicle Valuation

GarageOS can estimate:

* Total Investment
* Current Market Value
* Cost vs Value Ratio
* Depreciation Trends

Example:

Purchase Price: $7,000

Maintenance: $3,000

Modifications: $4,500

Total Invested: $14,500

Estimated Market Value: $9,000

---

## Future Features

### Marketplace

Buy and sell:

* Parts
* Wheels
* Tools
* Entire Vehicles

### AI Build Analysis

AI-powered recommendations:

* Similar Builds
* Recommended Upgrades
* Value Analysis
* Popular Modifications

### Build Comparisons

Compare two vehicles side-by-side.

### GarageOS Build Score

A proprietary score based on:

* Documentation Quality
* Build Completeness
* Community Ratings
* Maintenance History
* Modification Quality

---

# Monetization

## Phase 1

Free Platform

Goal:

* Build Community
* Gather Feedback
* Validate Product

---

## Phase 2

Affiliate Partnerships

Revenue Sources:

* Wheels
* Tires
* Tools
* Performance Parts
* Maintenance Products

---

## Phase 3

GarageOS Pro

Premium Features:

* Unlimited Vehicles
* Advanced Analytics
* Additional Storage
* Vehicle History Export
* Insurance Documentation
* Advanced Valuation Tools

---

# Mobile Experience

GarageOS will initially launch as a Progressive Web App (PWA).

Benefits:

* Single Codebase
* iPhone Support
* Android Support
* Push Notifications
* Offline Support
* Home Screen Installation

Users can install GarageOS directly from their browser without using an app store.

---

# MVP (Version 0.1)

## Authentication

* Registration
* Login
* User Profiles

## Garage

* Create Garage
* Add Vehicles
* Edit Vehicles

## Vehicle Features

* Vehicle Profiles
* Timeline
* Maintenance Records
* Modification Tracking
* Photo Gallery

## Community

* Rate My Car
* Comments
* User Profiles

## Build Cards

* Public Build Pages
* Sharing Links
* QR Code Generation

---

# Suggested Tech Stack

Frontend

* Next.js
* React
* TypeScript
* TailwindCSS

Backend

* Next.js API Routes
* tRPC

Database

* PostgreSQL

Authentication

* Auth.js

Storage

* Cloudflare R2

Hosting

* Vercel

Analytics

* PostHog

---

# Long-Term Goal

GarageOS aims to become the complete platform for automotive ownership.

Whether you want to:

- Track maintenance
- Document modifications
- Manage your garage inventory
- Showcase your build
- Follow other enthusiasts
- Track expenses
- Buy and sell parts
- Preserve your vehicle's history

GarageOS provides a single place to do it all.

From daily drivers to full restorations.

From first cars to entire collections.

GarageOS is the digital home for automotive enthusiasts.

# Implementation Roadmap

The roadmap is ordered by what should be built first to keep development realistic, testable, and useful at every stage.

---

## Version 0.1: Project Bootstrap

Goal: Get the project running.

Features:

* Create the initial web application
* Set up the project structure
* Add routing
* Add basic layout
* Add basic styling
* Add landing page
* Add placeholder dashboard page
* Add placeholder garage page
* Add placeholder vehicle page

Expected result:

The site boots, navigation works, and the main product structure exists.

---

## Version 0.2: Static Garage Prototype

Goal: Build the first clickable version without a database.

Features:

* Create garage page
* Add vehicle form
* Edit vehicle form
* Vehicle detail page
* Static mock vehicle data
* Static mock garage statistics
* Static mock modification list
* Static mock maintenance history

Expected result:

A user can experience the core GarageOS flow using mock data.

---

## Version 0.3: Database Foundation

Goal: Add persistent storage before authentication.

Features:

* Set up PostgreSQL
* Add database schema
* Add ORM
* Create vehicle table
* Create garage table
* Create maintenance record table
* Create modification table
* Add database migrations
* Seed database with demo data

Expected result:

GarageOS has real persistent data and a proper foundation for future features.

---

## Version 0.4: Vehicle CRUD

Goal: Make vehicle management work for real.

Features:

* Create vehicle
* Read vehicle
* Update vehicle
* Delete vehicle
* Save mileage
* Save specs
* Save ownership information
* Validate vehicle forms
* Add loading states
* Add error handling

Expected result:

Users can manage vehicles and the data is saved in the database.

---

## Version 0.5: Authentication

Goal: Add real users.

Features:

* Register account
* Log in
* Log out
* Protect authenticated pages
* Connect garages to users
* Connect vehicles to garages
* Add basic user profile

Expected result:

Each user has their own private garage.

---

## Version 0.6: Maintenance History

Goal: Build the first truly useful ownership feature.

Features:

* Add maintenance records
* Edit maintenance records
* Delete maintenance records
* Track mileage at service
* Track service cost
* Track service date
* Categorize maintenance records
* Show maintenance records on vehicle timeline

Expected result:

Users can document real service history for each vehicle.

---

## Version 0.7: Modification Tracking

Goal: Add build documentation.

Features:

* Add modifications
* Edit modifications
* Delete modifications
* Add modification categories
* Track installation date
* Track modification cost
* Track manufacturer
* Track product name
* Show modifications on vehicle profile
* Show modifications on vehicle timeline

Expected result:

Users can document the full build list of a vehicle.

---

## Version 0.8: Vehicle Timeline

Goal: Combine vehicle history into one clear view.

Features:

* Timeline view for each vehicle
* Combine maintenance records and modifications
* Sort events by date
* Filter timeline by category
* Show cost and mileage where relevant
* Add timeline cards

Expected result:

Each vehicle has a clear ownership history.

---

## Version 0.9: Photo Uploads

Goal: Make vehicles visual.

Features:

* Upload vehicle photos
* Store images
* Add photo gallery
* Select featured vehicle image
* Attach photos to vehicles
* Attach photos to modifications
* Attach photos to maintenance records

Expected result:

Users can visually document vehicles, builds, and maintenance.

---

## Version 1.0: Public Build Cards

Goal: Launch the first shareable product experience.

Features:

* Public vehicle profile page
* Shareable Build Card URL
* Hero image
* Vehicle specs
* Modification list
* Maintenance highlights
* Timeline preview
* Cost summary
* Public/private visibility setting
* Basic SEO metadata

Expected result:

Users can share their vehicle build with others.

---

## Version 1.1: PWA Support

Goal: Make GarageOS installable on phones.

Features:

* Add web app manifest
* Add app icons
* Add installable PWA support
* Add mobile navigation
* Improve responsive design
* Add offline-friendly shell

Expected result:

Users can add GarageOS to their iPhone or Android home screen and use it like an app.

---

## Version 1.2: Tool Inventory

Goal: Expand GarageOS from vehicle tracking to garage tracking.

Features:

* Add tools
* Edit tools
* Delete tools
* Tool categories
* Tool wishlist
* Purchase date
* Purchase price
* Storage location
* Notes

Expected result:

Users can track what they own in their garage and what they want to buy.

---

## Version 1.3: Spare Parts Inventory

Goal: Track parts, consumables, and garage stock.

Features:

* Add spare parts
* Edit spare parts
* Delete spare parts
* Quantity tracking
* Compatible vehicles
* Purchase history
* Low stock indicators
* Storage location

Expected result:

Users can manage parts and consumables across their vehicles.

---

## Version 1.4: Community Profiles

Goal: Start building the social layer.

Features:

* Public user profiles
* Public garage overview
* Follow users
* View public vehicles
* Recent build updates
* Profile bio
* Social links

Expected result:

Users can discover and follow other enthusiasts.

---

## Version 1.5: Rate My Car

Goal: Add community engagement.

Features:

* Submit vehicle to Rate My Car
* Rate vehicles
* Comment on vehicles
* Sort vehicles by rating
* Filter by category
* Prevent duplicate ratings from the same user
* Basic moderation tools

Expected result:

GarageOS becomes interactive and community-driven.

---

## Version 1.6: Leaderboards

Goal: Add competition and repeat visits.

Features:

* Global leaderboard
* Country leaderboard
* Local leaderboard
* Manufacturer leaderboard
* Category leaderboard
* Top 50 vehicles
* Time-based rankings

Expected result:

Users have a reason to improve, share, and revisit their builds.

---

## Version 1.7: Interactive Photo Tagging

Goal: Make build photos more useful.

Features:

* Tag parts on vehicle photos
* Link tags to modifications
* Show clickable tags on public Build Cards
* Edit tag positions
* Delete tags

Expected result:

Users can showcase exactly what parts are installed on their vehicle.

---

## Version 1.8: Expense Analytics

Goal: Give users insight into ownership cost.

Features:

* Total vehicle cost
* Maintenance cost
* Modification cost
* Repair cost
* Cost over time
* Cost by category
* Garage-wide spending overview

Expected result:

Users can understand how much they have invested in each vehicle and their garage.

---

## Version 1.9: QR Codes

Goal: Make Build Cards useful at meets and events.

Features:

* Generate QR code for each Build Card
* Download QR code
* Print-friendly QR page
* Optional public display mode

Expected result:

Users can show their GarageOS build at car meets, shows, and events.

---

## Version 2.0: Marketplace Foundation

Goal: Create the first buying and selling features.

Features:

* Create listing
* List vehicle parts
* List tools
* Add listing photos
* Add price
* Add description
* Contact seller
* Mark listing as sold

Expected result:

Users can buy and sell parts and tools using GarageOS.

---

## Version 2.1: GarageOS Pro

Goal: Add premium features.

Features:

* Subscription handling
* Increased storage limits
* Unlimited vehicles
* Advanced analytics
* Vehicle history export
* Premium Build Card themes
* Private backup exports

Expected result:

GarageOS has its first direct revenue stream.

---

## Version 2.2: Affiliate Integrations

Goal: Add long-term monetization through recommendations.

Features:

* Add product links to tools
* Add product links to modifications
* Add recommended tools
* Add recommended parts
* Track outbound clicks
* Affiliate partner support

Expected result:

GarageOS can earn revenue from tools, parts, wheels, tires, and maintenance products.

---

## Version 2.3: AI Build Analysis

Goal: Add intelligent recommendations.

Features:

* Analyze build data
* Recommend next upgrades
* Compare similar builds
* Estimate build completeness
* Suggest maintenance based on mileage
* Generate build summaries

Expected result:

GarageOS becomes smarter and more personalized.

---

## Version 2.4: Verified Builds

Goal: Increase trust and long-term value.

Features:

* Proof of ownership
* Invoice uploads
* Mileage verification
* Installed parts verification
* Verified Build badge
* Verified service history

Expected result:

GarageOS profiles become useful for sales, valuation, insurance, and trust.
