require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { User, Lead, Property, Client, Deal, CompanySettings, Activity } = require('./src/models');

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate_crm';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Lead.deleteMany({}),
      Property.deleteMany({}),
      Client.deleteMany({}),
      Deal.deleteMany({}),
      CompanySettings.deleteMany({}),
      Activity.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@realestate.com',
      passwordHash: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'ADMIN',
      phone: '+1-555-0100',
    });

    const agent1 = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah@realestate.com',
      passwordHash: 'Agent@123',
      role: 'AGENT',
      phone: '+1-555-0101',
    });

    const agent2 = await User.create({
      name: 'Mike Chen',
      email: 'mike@realestate.com',
      passwordHash: 'Agent@123',
      role: 'AGENT',
      phone: '+1-555-0102',
    });

    console.log('Created 3 users (1 admin, 2 agents)');

    // Create leads
    const leads = await Lead.insertMany([
      {
        name: 'John Smith',
        phone: '+1-555-1001',
        email: 'john.smith@email.com',
        budgetMin: 200000,
        budgetMax: 350000,
        propertyTypePreference: 'RESIDENTIAL',
        source: 'WEBSITE',
        status: 'NEW',
        assignedAgent: agent1._id,
        notes: 'Looking for a 3-bedroom family home',
      },
      {
        name: 'Emily Davis',
        phone: '+1-555-1002',
        email: 'emily.d@email.com',
        budgetMin: 500000,
        budgetMax: 800000,
        propertyTypePreference: 'COMMERCIAL',
        source: 'REFERRAL',
        status: 'CONTACTED',
        assignedAgent: agent1._id,
        notes: 'Interested in office spaces downtown',
      },
      {
        name: 'Robert Wilson',
        phone: '+1-555-1003',
        email: 'robert.w@email.com',
        budgetMin: 150000,
        budgetMax: 250000,
        propertyTypePreference: 'PLOT',
        source: 'AD',
        status: 'QUALIFIED',
        assignedAgent: agent2._id,
        notes: 'Looking for plot to build custom home',
      },
      {
        name: 'Lisa Anderson',
        phone: '+1-555-1004',
        email: 'lisa.a@email.com',
        budgetMin: 300000,
        budgetMax: 500000,
        propertyTypePreference: 'RESIDENTIAL',
        source: 'CALL',
        status: 'NEGOTIATION',
        assignedAgent: agent2._id,
        notes: 'Relocating for work, needs quick move-in',
      },
      {
        name: 'David Brown',
        phone: '+1-555-1005',
        email: 'david.b@email.com',
        budgetMin: 100000,
        budgetMax: 200000,
        propertyTypePreference: 'RESIDENTIAL',
        source: 'WALKIN',
        status: 'CLOSED',
        assignedAgent: agent1._id,
        notes: 'First-time buyer, purchased a condo',
      },
    ]);
    console.log('Created 5 leads');

    // Create properties
    const properties = await Property.insertMany([
      {
        title: 'Sunset View Villa',
        type: 'RESIDENTIAL',
        status: 'AVAILABLE',
        price: 450000,
        address: '123 Sunset Blvd, Los Angeles, CA 90028',
        latitude: 34.0984,
        longitude: -118.3267,
        areaSqFt: 2800,
        bedrooms: 4,
        bathrooms: 3,
        amenities: ['Swimming Pool', 'Garden', 'Garage', 'Smart Home', 'Security System'],
        description: 'Beautiful 4-bedroom villa with panoramic sunset views. Modern kitchen, spacious living areas, and a resort-style backyard with pool.',
        images: [],
        agent: agent1._id,
      },
      {
        title: 'Downtown Office Suite',
        type: 'COMMERCIAL',
        status: 'AVAILABLE',
        price: 750000,
        address: '456 Business Ave, New York, NY 10001',
        latitude: 40.7484,
        longitude: -73.9967,
        areaSqFt: 3500,
        bedrooms: 0,
        bathrooms: 2,
        amenities: ['Parking', 'Elevator', 'Conference Room', 'High-Speed Internet', 'HVAC'],
        description: 'Premium office space in the heart of downtown. Open floor plan with stunning city views. Ideal for growing companies.',
        images: [],
        agent: agent2._id,
      },
      {
        title: 'Green Valley Plot',
        type: 'PLOT',
        status: 'AVAILABLE',
        price: 180000,
        address: '789 Country Rd, Austin, TX 78701',
        latitude: 30.2672,
        longitude: -97.7431,
        areaSqFt: 5000,
        bedrooms: 0,
        bathrooms: 0,
        amenities: ['Road Access', 'Water Connection', 'Electricity', 'Fenced'],
        description: 'Prime residential plot in the rapidly developing Green Valley area. Ready for construction with all utilities connected.',
        images: [],
        agent: agent1._id,
      },
    ]);
    console.log('Created 3 properties');

    // Create clients
    const clients = await Client.insertMany([
      {
        name: 'David Brown',
        phone: '+1-555-1005',
        email: 'david.b@email.com',
        type: 'BUYER',
        budget: 200000,
        preferredLocations: ['Los Angeles', 'San Diego'],
        notes: 'First-time buyer, recently closed on a condo',
        lead: leads[4]._id,
      },
      {
        name: 'Margaret Taylor',
        phone: '+1-555-2001',
        email: 'margaret.t@email.com',
        type: 'SELLER',
        budget: 0,
        preferredLocations: ['New York', 'Boston'],
        notes: 'Selling inherited property, needs market valuation',
      },
    ]);
    console.log('Created 2 clients');

    // Create a deal
    const deal = await Deal.create({
      client: clients[0]._id,
      property: properties[0]._id,
      agent: agent1._id,
      stage: 'NEGOTIATION',
      dealValue: 450000,
      commissionPercent: 2.5,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: 'Client very interested, price negotiation in progress',
    });
    console.log('Created 1 active deal');

    // Create company settings
    await CompanySettings.create({
      companyName: 'PropertyHub CRM',
      address: '100 Main Street, Suite 200, San Francisco, CA 94105',
      contactEmail: 'info@propertyhub.com',
      contactPhone: '+1-555-0000',
      defaultCommissionResidential: 2.5,
      defaultCommissionCommercial: 2.0,
      defaultCommissionPlot: 1.5,
    });
    console.log('Created company settings');

    // Create some activity entries
    await Activity.insertMany([
      {
        type: 'LEAD_CREATED',
        description: 'New lead "John Smith" created',
        entityType: 'LEAD',
        entityId: leads[0]._id,
        user: admin._id,
      },
      {
        type: 'PROPERTY_CREATED',
        description: 'Property "Sunset View Villa" listed',
        entityType: 'PROPERTY',
        entityId: properties[0]._id,
        user: agent1._id,
      },
      {
        type: 'DEAL_CREATED',
        description: 'New deal created with value $450,000',
        entityType: 'DEAL',
        entityId: deal._id,
        user: agent1._id,
      },
    ]);
    console.log('Created activity entries');

    console.log('\n=== Seed Complete ===');
    console.log(`Admin login: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log(`Agent 1 login: sarah@realestate.com / Agent@123`);
    console.log(`Agent 2 login: mike@realestate.com / Agent@123`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
