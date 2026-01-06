# 🏠 Utility Billing System

A comprehensive full-stack web application for managing utility services including electricity, water, and gas connections. Built with **Angular 19** frontend and **ASP.NET Core 8** Web API backend.

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running The Application](#running-the-application)
- [Features](#features)

---

## 📖 About The Project

The **Utility Management System** is designed to streamline the management of utility services for both administrators and consumers. It provides functionalities for:

- **Consumer Management** - Register, manage, and track consumer accounts
- **Connection Management** - Handle utility connections (electricity, water, gas)
- **Meter Reading** - Record and track meter readings
- **Billing System** - Generate and manage utility bills
- **Payment Processing** - Track payments and outstanding balances
- **Reporting & Analytics** - Generate revenue reports, consumption analysis, and aging reports
- **Notifications** - Real-time notifications for users

---

## 🛠️ Tech Stack

| Layer      | Technology                                      |
|------------|------------------------------------------------|
| Frontend   | Angular 19, TypeScript, SCSS, Bootstrap        |
| Backend    | ASP.NET Core 8 Web API, Entity Framework Core  |
| Database   | SQL Server (LocalDB / SQL Server Express)      |
| Auth       | ASP.NET Core Identity, JWT Authentication      |

---

## 📁 Folder Structure

```
Capstone Code/
│
├── Utility_Mgmt_Api/          # 🔧 Backend - ASP.NET Core Web API
│   ├── Controllers/           # API endpoints for all resources
│   ├── Data/                  # DbContext and data seeding
│   ├── DTOs/                  # Data Transfer Objects for API requests/responses
│   ├── Entities/              # Database entity models
│   ├── Middleware/            # Custom middleware (exception handling)
│   ├── Migrations/            # Entity Framework database migrations
│   ├── Services/              # Business logic layer
│   │   ├── Interfaces/        # Service contracts
│   │   └── Implementations/   # Service implementations
│   ├── Properties/            # Launch settings
│   ├── appsettings.json       # Application configuration
│   └── Program.cs             # Application entry point
│
├── Utility_Mgmt_App/          # 🎨 Frontend - Angular Application
│   ├── src/
│   │   ├── app/               # Angular components, services, guards
│   │   ├── environments/      # Environment configurations
│   │   └── styles.scss        # Global styles
│   ├── public/                # Static assets
│   ├── angular.json           # Angular CLI configuration
│   ├── package.json           # Node.js dependencies
│   └── tsconfig.json          # TypeScript configuration
│
└── UtilityManagementTest/     # 🧪 Unit Tests
    └── Unit_Test/             # Test cases for backend services
```

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

| Software          | Version    | Download Link                                              |
|-------------------|------------|-----------------------------------------------------------|
| Node.js           | 18.x+      | [nodejs.org](https://nodejs.org/)                         |
| Angular CLI       | 19.x       | `npm install -g @angular/cli`                             |
| .NET SDK          | 8.0+       | [dotnet.microsoft.com](https://dotnet.microsoft.com/)     |
| SQL Server        | 2019+      | [SQL Server Express](https://www.microsoft.com/sql-server)|

---

## 🚀 Installation & Setup

### Step 1: Download or Clone the Repository

**Option A: Clone the repository**
```bash
git clone https://github.com/your-username/utility-management-system.git
```

**Option B: Download ZIP**
- Click the green **"Code"** button on GitHub
- Select **"Download ZIP"**
- Extract the downloaded ZIP file

---

### Step 2: Navigate to the Project Folder

```bash
cd "Capstone Code"
```

---

### Step 3: Install Frontend Dependencies

Navigate to the Angular frontend folder and install node modules:

```bash
cd Utility_Mgmt_App
npm install
```

> ⏳ This may take a few minutes to download all dependencies.

---

### Step 4: Setup Backend Database

Navigate to the .NET backend folder and run database migrations:

```bash
cd ../Utility_Mgmt_Api
dotnet restore
dotnet ef database update
```

> 📝 **Note:** Make sure your SQL Server connection string in `appsettings.json` is correctly configured before running migrations.

**Default Connection String (LocalDB):**
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=UtilityManagementDb;Trusted_Connection=True;"
}
```

---

## ▶️ Running The Application

### Step 1: Start the Backend API

Open a terminal in the `Utility_Mgmt_Api` folder:

```bash
cd Utility_Mgmt_Api
dotnet run
```

The API will start at: `https://localhost:5001` or `http://localhost:5000`

---

### Step 2: Start the Frontend Application

Open a **new terminal** in the `Utility_Mgmt_App` folder:

```bash
cd Utility_Mgmt_App
ng serve
```

The Angular app will start at: `http://localhost:4200`

---

### Step 3: Access the Application

Open your browser and navigate to:

```
http://localhost:4200
```

---

## ✨ Features

### 👤 Consumer Portal
- View and manage profile
- View active connections
- Request new utility connections
- View bills and payment history
- Make payments online
- Track consumption

### 👨‍💼 Admin Dashboard
- Manage consumers and connections
- Process connection requests
- Record meter readings
- Generate bills (individual/bulk)
- View revenue reports
- Track outstanding payments
- Manage tariff plans and utility types

### 📊 Reports & Analytics
- Dashboard overview with key metrics
- Revenue reports by utility type
- Consumption analysis
- Outstanding/aging reports
- Top consumers report

---

## 📄 License

This project is developed as part of an academic capstone project.

---

## 👨‍💻 Author

**Ashutosh Jena**

---

⭐ If you found this project helpful, please give it a star!
