
# Red Team A2A: AI-Driven Vulnerability Assessment for A2A Servers

## 1. What is this project?

Red Team A2A is a Next.js web application designed for AI-driven vulnerability assessment of Agent-to-Agent (A2A) communication servers. It employs generative AI (leveraging Genkit and Gemini models) to simulate various red teaming attack scenarios against a target A2A server. The primary goal is to automatically formulate varied and challenging prompts that identify potential vulnerabilities.

The application features:
- An AI-powered red teaming engine that tests for various threat categories.
- An embedded mock A2A server that simulates a vulnerable backend, allowing the red teaming AI to perform live HTTP interactions.
- An interactive dashboard to configure tests, view vulnerability reports, and inspect interaction logs.

## 2. What has been implemented?

### Core Features:
- **AI Red Teaming Engine:**
    - Uses Genkit with Google's Gemini models.
    - Capable of testing against various threat categories.
    - For some tests (initially "Direct Control Hijacking"), it can perform live HTTP interactions with the mock server using a Genkit tool.
    - For other tests, it performs analysis based on a provided A2A server specification.
- **Embedded Mock A2A Server:**
    - Implemented as a Next.js API route (`/api/mock-a2a/...`).
    - Simulates a vulnerable backend with SQL-like command processing (e.g., `insert`, `delete`, `drop`, `show`) and an environment variable exposure vulnerability (`attack env`).
    - Includes endpoints for discovery (`/.well-known/agent.json`), database reset (`/debug/reset`), and simulated SQLi (`/debug/sqli`).
- **Vulnerability Reporting & Interaction Logging:**
    - Displays generated vulnerability reports and detailed interaction logs (including actual HTTP requests/responses where applicable).
- **Session Management & UI:**
    - A Next.js frontend built with React, ShadCN UI components, and Tailwind CSS.
    - Dashboard to input/discover A2A server specifications.
    - Interface to select and run tests for different threat categories.
- **Dynamic A2A Server Specification Discovery:**
    - A feature to automatically generate a JSON specification for the embedded mock A2A server, which can then be used for testing.

### Implemented Threat Categories (AI Flows):
The application includes AI-driven testing flows for the following threat categories:
- Agent Authorization and Control Hijacking (includes live HTTP testing)
- Checker-Out-of-the-Loop
- Agent Critical System Interaction
- Agent Goal and Instruction Manipulation
- Agent Hallucination Exploitation
- Agent Impact Chain and Blast Radius
- Agent Knowledge Base Poisoning
- Agent Memory and Context Manipulation
- Agent Orchestration and Multi-Agent Exploitation
- Agent Resource and Service Exhaustion
- Agent Supply Chain and Dependency Attacks
- Agent Untraceability

## 3. How to Run

### Prerequisites:
- Node.js (version 18 or higher recommended)
- npm or yarn

### Setup:
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/appsec2008/red-team-agent-against-mock-a2aserver.git
    cd red-team-agent-against-mock-a2aserver
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # OR
    # yarn install
    ```
3.  **Environment Variables:**
    - Create a `.env` file in the root of the project.
    - You will need to add your Google AI API Key (for Gemini models used by Genkit):
      ```env
      GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
      ```
    - You might also want to set `NEXT_PUBLIC_APP_URL` if you are deploying or if the default `http://localhost:9002` is not suitable for your local setup (this is used by the mock server's agent card and discovery):
      ```env
      NEXT_PUBLIC_APP_URL=http://localhost:9002
      ```

### Running the Application:
There are two main parts to run for development: the Next.js frontend/backend and the Genkit development server (for observing flows, traces, etc.).

1.  **Start the Next.js Development Server:**
    (This serves the UI and the embedded mock A2A server)
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:9002`.

2.  **Start the Genkit Development Server (Optional but Recommended for Debugging AI Flows):**
    In a separate terminal:
    ```bash
    npm run genkit:watch
    ```
    The Genkit Dev UI will typically be available at `http://localhost:4000`. This UI allows youto inspect flow traces, inputs, outputs, and any errors from the Genkit AI flows.

### Using the Application:
1.  Open your browser and navigate to `http://localhost:9002`.
2.  On the dashboard:
    - **A2A Server Specification:**
        - You can click the "Discover & Generate Mock A2A Server Spec (JSON)" button. This will populate the textarea with a JSON specification describing the *embedded* mock A2A server (which runs at `/api/mock-a2a/...` within the Next.js app).
        - Alternatively, if you have an external A2A server you wish to test, you can paste its JSON specification here, ensuring the `fullUrl` for each endpoint is correct and accessible from where this Red Team A2A app is running.
    - **Threat Categories:** Select a threat category from the list.
    - **Run Test:** Click "Run Test". The AI will then perform its assessment based on the selected category and the provided/discovered specification.
    - View the "Vulnerability Report" and "Interaction Log" in the right-hand panel.

## 4. How to Contribute

Contributions are welcome! Please follow these steps:

1.  **Fork the repository** on GitHub: [https://github.com/appsec2008/red-team-agent-against-mock-a2aserver](https://github.com/appsec2008/red-team-agent-against-mock-a2aserver)
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/red-team-agent-against-mock-a2aserver.git
    cd red-team-agent-against-mock-a2aserver
    ```
3.  **Create a new branch** for your feature or bug fix:
    ```bash
    git checkout -b my-new-feature
    ```
4.  **Make your changes.**
5.  **Commit your changes:**
    ```bash
    git commit -am 'Add some feature'
    ```
6.  **Push to your branch:**
    ```bash
    git push origin my-new-feature
    ```
7.  **Create a new Pull Request** from your fork on GitHub.

Please ensure your code adheres to the existing style and that any new AI flows or significant changes are well-documented.

## 5. Acknowledgements and Inspiration

This project is inspired by the **Agentic AI Red Teaming guide**, a joint effort by the Cloud Security Alliance (CSA) and OWASP AI Exchange, led by Ken Huang.

The publication can be found at: [https://cloudsecurityalliance.org/artifacts/agentic-ai-red-teaming-guide](https://cloudsecurityalliance.org/artifacts/agentic-ai-red-teaming-guide)

We extend our gratitude for their insightful work which provided a foundational understanding for this project.

### Contributors to the Agentic AI Red Teaming Guide:

**Lead Author:**
- Ken Huang

**Co-Chairs:**
- Ken Huang
- Nick Hamilton

**Contributors and Reviewers:**
- Jerry Huang
- Michael Roza
- Michael Morgenstern
- Hosam Gemei
- Akram Sheriff
- Qiang Zhang
- Rajiv Bahl
- Brian M. Green
- Alan Curran
- Alex Polyakov
- Semih Gelişli
- Kelly Onu
- Satbir Singh
- Adnan Kutay Yüksel
- Trent H.
- William Armiros
- Sai Honig
- Jacob Rideout
- Will Trefiak
- Tal Shapira
- Adam Ennamli
- Krystal Jackson
- Akash Mukherjee
- Mahesh Adulla
- Frank Jaeger
- Dan Sorensen
- Emile Delcourt
- Idan Habler
- Ron Bitton
- Jannik Maierhoefer
- Bo Li
- Yuvaraj Govindarajulu
- Behnaz Karimi
- Disesdi Susanna Cox
- Gian Kapoor
- Yotam Barak
- Susanna Cox
- Ante Gojsalic
- Dharnisha Narasappa
- Sakshi Mittal
- Naveen Kumar Yeliyyur
- Rudraradhya
- Jayesh Dalmet
- Akshata Krishnamoorthy Rao
- Prateek Mittal
- Raymond Lee
- Srihari
- James Stewart
- Chetankumar Patel
- Govindaraj Palanisamy
- Rani Kumar Rajah Anirudh Murali

**OWASP AI Exchange Leads:**
- Rob van der Veer
- Aruneesh Salhotra
- Behnaz Karimi
- Yuvaraj Govindarajulu
- Disesdi Susanna Cox
- Rajiv Bahl

**CSA Global Staff:**
- Alex Kaluza
- Stephen Lumpe
- Stephen Smith

## 6. License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2024 Ken Huang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
