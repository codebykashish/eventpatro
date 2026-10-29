// Script to seed initial campus events for testing Phase 2
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const { Event } = require('../models/Event')

const sampleEvents = [
  {
    title: 'Sunway Tech Hackathon 2026',
    description:
      'A 24-hour campus hackathon bringing together students from BSc CS and BIT to build innovative software solutions solving real-world problems in education, sustainability, and healthtech. Mentorship from industry professionals and cash prizes for top 3 teams!',
    category: 'workshop',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    location: 'Sunway Main Auditorium, Block A',
    capacity: 60,
    coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    isPublished: true,
  },
  {
    title: 'Annual Cultural Fest — Rhythm & Beats',
    description:
      'Sunway College presents the biggest cultural festival of the year! Join us for a full day of music performances, dance competitions, drama acts, multicultural food stalls, and an evening live acoustic concert by top student bands.',
    category: 'cultural',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    location: 'College Open Amphitheatre',
    capacity: 350,
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    isPublished: true,
  },
  {
    title: 'Applied AI & Deep Learning Masterclass',
    description:
      'Hands-on session exploring Modern Artificial Intelligence, Transformers, and LLMs. Learn how to train and deploy computer vision and NLP models on cloud platforms with real-world datasets.',
    category: 'academic',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    location: 'Advanced Computing Lab 3',
    capacity: 40,
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    isPublished: true,
  },
  {
    title: 'Inter-Department Futsal Championship',
    description:
      'Cheer for your faculty team in the annual Sunway Futsal Championship! 16 teams compete in knockout stages for the prestigious Chancellor Trophy.',
    category: 'sports',
    date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
    location: 'Kathmandu Sports Complex Arena',
    capacity: 100,
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    isPublished: true,
  },
]

const seedEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB for event seeding...')

    // Find admin user to assign as organiser
    const admin = await User.findOne({ role: 'admin' })
    if (!admin) {
      console.error('No admin user found. Please run npm run seed:admin first.')
      process.exit(1)
    }

    // Check existing events
    const existingCount = await Event.countDocuments()
    if (existingCount > 0) {
      console.log(`Events already exist in database (${existingCount} events found).`)
      console.log('Clearing existing events to provide fresh sample events...')
      await Event.deleteMany({})
    }

    const eventsToInsert = sampleEvents.map((ev) => ({
      ...ev,
      organiser: admin._id,
      registeredUsers: [],
    }))

    const created = await Event.insertMany(eventsToInsert)
    console.log(`Successfully seeded ${created.length} sample events!`)
    created.forEach((e) => console.log(`- [${e.category.toUpperCase()}] ${e.title}`))

    process.exit(0)
  } catch (err) {
    console.error('Error seeding events:', err.message)
    process.exit(1)
  }
}

seedEvents()
