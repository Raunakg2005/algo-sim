"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import {
  ArrowRight,
  Code,
  Lightbulb,
  Zap,
  BookOpen,
  Users,
  BarChart,
  Github,
  Linkedin,
  Mail,
  Twitter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Footer from "../footer"
import { useSession, signOut } from "next-auth/react"

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 },
  },
}

export default function AboutPage() {
  const { data: session } = useSession();
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 300])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in")
          }
        })
      },
      { threshold: 0.1 },
    )

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const parallaxElements = document.querySelectorAll(".parallax-element")

      parallaxElements.forEach((element) => {
        const speed = element.getAttribute("data-speed") || "0.1"
        const yPos = -(scrollY * Number.parseFloat(speed))
        element.setAttribute("style", `transform: translateY(${yPos}px)`)
      })
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Team members data - only Raunak as it was a solo project
  const teamMembers = [
    {
      name: "Raunak Kumar Gupta",
      role: "Software Architect",
      bio: "Algorithm enthusiast with a passion for making complex concepts accessible through visualization. Created Algo-Sim as a solo project to help students understand algorithms through interactive learning.",
      image: "/rkg.jpg",
      social: {
        github: "https://github.com/Raunakg2005",
        linkedin: "https://www.linkedin.com/in/raunak-kumar-gupta-7b3503270",
        twitter: "#",
      },
    },
  ]

  // Timeline data
  const timeline = [
    {
      year: "2022",
      title: "Concept Development",
      description: "Initial idea and research on algorithm visualization techniques.",
    },
    {
      year: "2023",
      title: "Beta Launch",
      description: "First version released with core sorting and graph algorithms.",
    },
    {
      year: "2024",
      title: "Platform Expansion",
      description: "Added dynamic programming, backtracking, and branch & bound algorithms.",
    },
    {
      year: "Future",
      title: "Community & Collaboration",
      description: "Expanding to include user contributions and academic partnerships.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-purple-700">
              Algo-Sim
            </Link>
            <nav className="hidden md:flex space-x-6 items-center">
              <Link href="/" className="text-gray-600 hover:text-purple-700 transition-colors">
                Home
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-purple-700 transition-colors">
                Dashboard
              </Link>
              <Link href="/about" className="text-purple-700 font-medium">
                About
              </Link>
              <Link href="/feedback" className="text-gray-600 hover:text-purple-700 transition-colors">
                Feedback
              </Link>
              {session ? (
                <>
                  <span className="text-sm text-gray-600">{session.user?.email}</span>
                  {session.user?.isAdmin && (
                    <Link href="/admin" className="text-gray-600 hover:text-purple-700 transition-colors">
                      Admin
                    </Link>
                  )}
                  <Button onClick={() => signOut()} variant="outline" size="sm">
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/auth/signin">
                  <Button variant="default" size="sm">
                    Login
                  </Button>
                </Link>
              )}
            </nav>
            <div className="md:hidden">
              <button className="text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Parallax */}
    <section
      ref={heroRef}
      className="relative py-20 bg-gradient-to-r from-purple-700 to-indigo-800 text-white overflow-hidden min-h-screen flex items-center"
    >
      {/* Abstract background elements with parallax */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div
        className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full mix-blend-overlay blur-xl parallax-element"
        data-speed="0.05"
        ></div>
        <div
        className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-300 rounded-full mix-blend-overlay blur-xl parallax-element"
        data-speed="0.1"
        ></div>
        <div
        className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-300 rounded-full mix-blend-overlay blur-xl parallax-element"
        data-speed="0.15"
        ></div>

        {/* Code-like elements with parallax */}
        <div
        className="hidden lg:block absolute top-20 right-20 text-4xl font-mono opacity-10 parallax-element"
        data-speed="0.2"
        >
        {`{sort(array)}`}
        </div>
        <div
        className="hidden lg:block absolute bottom-20 left-1/4 text-4xl font-mono opacity-10 parallax-element"
        data-speed="0.25"
        >
        {`while(true)`}
        </div>
        <div
        className="hidden lg:block absolute top-1/3 left-10 text-4xl font-mono opacity-10 parallax-element"
        data-speed="0.3"
        >
        {`O(n log n)`}
        </div>
      </div>

      <motion.div style={{ y, opacity }} className="container mx-auto px-6 relative z-10">
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-3xl mx-auto text-center"
        >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Visualize. Learn. Innovate.
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-2xl mx-auto">
          Transforming complex algorithms into interactive, step-by-step visualizations that make learning intuitive
          and engaging.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/dashboard">
            <Button
            size="lg"
            className="bg-white text-purple-800 hover:bg-purple-100 hover:scale-110 hover:translate-x-2 transition-transform duration-300 ease-in-out"
            >
            Explore Algorithms <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="#mission">
            <Button
            size="lg"
            className="bg-purple-700 text-white hover:bg-purple-800 hover:scale-110 hover:translate-x-2 transition-transform duration-300 ease-in-out"
            >
            Our Mission
            </Button>
          </Link>
        </div>
        </motion.div>
      </motion.div>
    </section>

      {/* Mission Section */}
      <section id="mission" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center animate-on-scroll"
          >
            <div className="inline-block p-3 bg-purple-100 rounded-full mb-6">
              <Lightbulb className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">Our Mission</h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              We're on a mission to demystify algorithms by transforming abstract concepts into tangible, interactive
              experiences. We believe that visualization is the key to understanding, and that everyone deserves access
              to high-quality educational tools that make learning algorithms engaging, intuitive, and effective.
            </p>
            <div className="flex justify-center">
              <div className="h-1 w-20 bg-purple-600 rounded-full"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">What We Offer</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides a comprehensive suite of tools to help you master algorithms through visualization.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Code className="h-8 w-8 text-purple-600" />,
                title: "Sorting Algorithms",
                description:
                  "Interactive visualizations of popular sorting algorithms like Merge Sort, Quick Sort, and Heap Sort.",
              },
              {
                icon: <BarChart className="h-8 w-8 text-blue-600" />,
                title: "Graph Algorithms",
                description:
                  "Step-by-step walkthroughs of graph traversal, shortest path, and minimum spanning tree algorithms.",
              },
              {
                icon: <Zap className="h-8 w-8 text-green-600" />,
                title: "Dynamic Programming",
                description:
                  "Visual breakdowns of complex DP problems like Knapsack, Matrix Chain Multiplication, and more.",
              },
              {
                icon: <BookOpen className="h-8 w-8 text-yellow-600" />,
                title: "Comprehensive Explanations",
                description:
                  "Detailed explanations of algorithm concepts, time complexity, and real-world applications.",
              },
              {
                icon: <Users className="h-8 w-8 text-red-600" />,
                title: "Community Learning",
                description:
                  "Share insights, discuss approaches, and learn collaboratively with fellow algorithm enthusiasts.",
              },
              {
                icon: <Lightbulb className="h-8 w-8 text-indigo-600" />,
                title: "Custom Inputs",
                description: "Test algorithms with your own inputs to deepen understanding and explore edge cases.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                whileHover={{ scale: 1.03 }}
              >
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-gray-200 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="lg:w-1/2 animate-on-scroll"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">Our Story</h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Algo-Sim began with a simple observation: traditional algorithm education often fails to connect
                abstract concepts with visual understanding. As a computer science student myself, I struggled with
                grasping complex algorithms through text and pseudocode alone.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                I envisioned a platform where learners could see algorithms in action, manipulate inputs, and observe
                the step-by-step execution process. What started as a personal project to enhance my own understanding
                quickly evolved into a comprehensive educational tool that I'm proud to share with students, educators,
                and professionals worldwide.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Today, I'm committed to continuously expanding the library of algorithm visualizations and enhancing the
                learning experience through cutting-edge interactive tools and comprehensive explanations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="lg:w-1/2 animate-on-scroll"
            >
              <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
                <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Our Journey</h3>
                <div className="space-y-8">
                  {timeline.map((item, index) => (
                    <div key={index} className="flex">
                      <div className="flex flex-col items-center mr-6">
                        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                          {item.year}
                        </div>
                        {index < timeline.length - 1 && <div className="h-full w-0.5 bg-purple-200 my-2"></div>}
                      </div>
                      <div className="pt-1">
                        <h4 className="text-lg font-semibold mb-1">{item.title}</h4>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Meet The Creator</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The passionate mind behind Algo-Sim, dedicated to making algorithm learning accessible and engaging.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative h-64 bg-purple-100 overflow-hidden">
                  <Image
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-purple-600 mb-4">{member.role}</p>
                  <p className="text-gray-600 mb-6">{member.bio}</p>
                  <div className="flex space-x-4">
                    <a
                      href={member.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-purple-600 transition-colors"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                    <a
                      href={member.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-purple-600 transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                    <a
                      href={member.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-purple-600 transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - No gap between this and Team section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="lg:w-1/2 animate-on-scroll"
            >
              <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 group">
                <Image
                  src="/image.png?height=600&width=800"
                  alt="Algorithm visualization in action"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <div className="p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">Interactive Learning</h3>
                    <p>Engage with algorithms in a hands-on, visual environment</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:w-1/2 animate-on-scroll"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">Why Choose Us</h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Interactive Visualizations",
                    description:
                      "See algorithms in action with step-by-step animations that bring abstract concepts to life.",
                  },
                  {
                    title: "Comprehensive Coverage",
                    description:
                      "From basic sorting to advanced graph algorithms, we cover a wide range of algorithm categories.",
                  },
                  {
                    title: "User-Friendly Interface",
                    description: "Intuitive controls and clean design make learning algorithms accessible to everyone.",
                  },
                  {
                    title: "Educational Depth",
                    description:
                      "Detailed explanations, time complexity analysis, and real-world applications provide context and deeper understanding.",
                  },
                ].map((point, index) => (
                  <motion.div
                    key={index}
                    className="flex hover:bg-white p-4 rounded-lg transition-colors duration-300 hover:shadow-md"
                    whileHover={{ x: 5 }}
                  >
                    <div className="mr-4 mt-1">
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{point.title}</h3>
                      <p className="text-gray-600">{point.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
    {/* Testimonials Section */}
    <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">
                What People Are Saying
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                Discover how Algo-Sim is making a difference in the lives of learners and professionals.
            </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
                {
                quote:
                    "Algo-Sim transformed my understanding of algorithms. The interactive visualizations helped me grasp concepts that I struggled with for years. It's an invaluable resource for any computer science student.",
                name: "Sarah Johnson",
                role: "Computer Science Student",
                },
                {
                quote:
                    "As an engineering student, Algo-Sim has been a game-changer for me. The visualizations make even the toughest algorithms easy to understand.",
                name: "Aarav Sharma",
                role: "Engineering Student",
                },
                {
                quote:
                    "I never thought learning algorithms could be this engaging. Algo-Sim's interactive approach is simply brilliant!",
                name: "Priya Patel",
                role: "Software Developer",
                },
                {
                quote:
                    "Algo-Sim's intuitive design and interactive features have truly redefined the way I approach studying algorithms. Highly recommended!",
                name: "Emma Garcia",
                role: "Computer Engineering Student",
                },
            ].map((testimonial, index) => (
                <div
                key={index}
                className="flex flex-col p-6 bg-white rounded-lg border-l-4 border-purple-600 shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                <p className="text-base italic text-gray-700 leading-relaxed mb-4">
                    "{testimonial.quote}"
                </p>
                <div className="mt-auto">
                    <p className="font-semibold text-gray-800 text-base">
                    {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
                </div>
            ))}
            </div>
        </div>
    </section>



      {/* Contact Section */}
      <section className="py-20 bg-purple-700 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Have questions or feedback? I'd love to hear from you!
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm p-8 rounded-lg hover:bg-white/15 transition-colors duration-300"
            >
              <h3 className="text-2xl font-bold mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center group">
                  <Mail className="h-5 w-5 mr-3 group-hover:text-purple-300 transition-colors" />
                  <a
                    href="mailto:raunakg2005@gmail.com"
                    className="hover:underline group-hover:text-purple-300 transition-colors"
                  >
                    raunakg2005@gmail.com
                  </a>
                </div>
                <div className="flex items-center group">
                  <Github className="h-5 w-5 mr-3 group-hover:text-purple-300 transition-colors" />
                  <a
                    href="https://github.com/Raunakg2005"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline group-hover:text-purple-300 transition-colors"
                  >
                    github.com/Raunakg2005
                  </a>
                </div>
                <div className="flex items-center group">
                  <Linkedin className="h-5 w-5 mr-3 group-hover:text-purple-300 transition-colors" />
                  <a
                    href="https://www.linkedin.com/in/raunak-kumar-gupta-7b3503270"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline group-hover:text-purple-300 transition-colors"
                  >
                    linkedin.com/in/raunak-kumar-gupta
                  </a>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-xl font-semibold mb-3">Follow Me</h4>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors hover:scale-110 transform duration-300"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href="https://github.com/Raunakg2005"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors hover:scale-110 transform duration-300"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/raunak-kumar-gupta-7b3503270"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors hover:scale-110 transform duration-300"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white text-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <h3 className="text-2xl font-bold mb-4">Send Me a Message</h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-300"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-300"
                    placeholder="Your email"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-300"
                    placeholder="Your message"
                  ></textarea>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:translate-y-[-2px]">
                  Send Message
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Ready to explore algorithms?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Dive into our interactive visualizations and master algorithms through visual learning.
            </p>
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-white text-purple-700 hover:bg-purple-100 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:translate-y-[-2px]"
              >
                Start Exploring
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Add custom styles for animations */}
      <style jsx>{`
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        
        .animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  )
}
