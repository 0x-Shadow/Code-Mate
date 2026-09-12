# Code-Mate — Browser IDE SaaS Starter (Next.js + Clerk + Convex + Stripe)

Run JavaScript, Python, Java, Go, Rust, C++, C#, Ruby, Swift, TypeScript in the browser (Piston), save/share snippets, gate Pro runs with Stripe + Convex quotas.

- Live demo: _(paste your Vercel URL here)_
- Stack: Next.js 15, Clerk, Convex, Monaco, Zustand, Tailwind
- Payments: Stripe (primary) + LemonSqueezy (legacy)
- Limits: 30 runs/day Free, 1000/day Pro (see `convex/codeExecutions.ts`)
- Supports **10+ programming languages**
- Real-time code execution and output visualization
- Built-in handling for **Success** and **Error** states
- Clean, distraction-free editor interface

### 🎨 **Customizable Experience**
- Choose from **5 VSCode-inspired themes**
- Adjustable **font size controls**
- Persistent settings for consistent user experience

### 🤝 **Community-Driven Platform**
- Share, explore, and collaborate through a **Code Snippet Library**
- Advanced search and filtering options
- Engage with other developers’ snippets and profiles

### 👤 **User Dashboard**
- Manage your personal profile
- Track **execution history**
- View statistics and coding insights

### 💎 **Flexible Pricing**
- Free plan for learners and hobbyists  
- Pro plan for professionals with extended capabilities

### ⚙️ **Advanced Capabilities**
- **Webhook integration** for real-world workflows
- **Comprehensive analytics dashboard**
- Step-by-step **deployment walkthrough** for self-hosting

---

## 🧩 Tech Stack

| Category | Technologies Used |
|-----------|-------------------|
| Frontend | **Next.js 15**, **TypeScript**, **Tailwind CSS** |
| Backend | **Convex** |
| Authentication | **Clerk** |
| Database | **Convex Database** |
| Hosting | **Vercel / Convex Cloud** |
| Language Support | 10+ languages including JavaScript, Python, C++, Java, Go, Rust, PHP, and more |

---


---

## 🧠 How It Works

1. **Sign in** securely using Clerk authentication  
2. **Select a language** and start coding instantly in the browser  
3. **Run code** with instant output feedback  
4. **Save snippets** or share them with the developer community  
5. **Explore and collaborate** using the community library  

---

## 🌟 Vision

Code-Mate aims to make coding more **collaborative, accessible, and inspiring**.  
Whether you're a beginner writing your first “Hello World” or a professional testing snippets, Code-Mate is built to **empower every coder** with a smarter, more connected environment.

---

## 🧑‍💻 Developer

**👤 [Your Name]**  
📧 [Your Email](mailto:you@example.com)  
🌐 [Portfolio](#) | 💼 [LinkedIn](#) | 🐙 [GitHub](#)

---

## 🪄 Future Enhancements

- Real-time collaborative coding (pair programming)
- AI-powered code suggestions & explanations
- Integration with GitHub for snippet sync
- Mobile-friendly editor view
- Snippet version control

---

## 🏁 Getting Started

```bash
# Clone the repository
git clone https://github.com/<your-username>/code-mate.git

# Navigate to the project directory
cd code-mate

# Install dependencies
npm install

# Set up environment variables
# (Refer to .env.example for configuration details)

# Run the development server
npm run dev
