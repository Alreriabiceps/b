const { ServiceCategory } = require("../models");

// Initialize database with default data
const initializeDatabase = async () => {
  try {
    // Insert default service categories if they don't exist
    const categories = [
      {
        name: "Carpentry",
        description: "Wood work, furniture repair, cabinet installation",
        keywords: "door,window,cabinet,furniture,wood,repair,broken",
      },
      {
        name: "Plumbing",
        description: "Pipe repair, fixture installation, leak fixes",
        keywords: "pipe,leak,faucet,toilet,water,drain,plumbing",
      },
      {
        name: "Electrical",
        description: "Wiring, outlet installation, electrical repairs",
        keywords: "wire,outlet,switch,electrical,power,light,circuit",
      },
      {
        name: "Painting",
        description: "Interior and exterior painting services",
        keywords: "paint,wall,ceiling,exterior,interior,color",
      },
      {
        name: "Cleaning",
        description: "House cleaning, deep cleaning, maintenance",
        keywords: "clean,dirty,mess,house,office,maintenance",
      },
      {
        name: "Landscaping",
        description: "Garden maintenance, lawn care, tree services",
        keywords: "garden,lawn,tree,grass,plant,landscape",
      },
      {
        name: "Appliance Repair",
        description: "Fixing household appliances",
        keywords:
          "refrigerator,washer,dryer,dishwasher,oven,microwave,appliance",
      },
      {
        name: "HVAC",
        description: "Heating, ventilation, air conditioning",
        keywords: "air,heating,cooling,ventilation,hvac,temperature",
      },
      {
        name: "Roofing",
        description: "Roof repair and installation",
        keywords: "roof,shingle,leak,gutter,tile",
      },
      {
        name: "Flooring",
        description: "Floor installation and repair",
        keywords: "floor,tile,carpet,hardwood,laminate",
      },
    ];

    for (const category of categories) {
      await ServiceCategory.findOneAndUpdate(
        { name: category.name },
        category,
        { upsert: true }
      );
    }

    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

module.exports = { initializeDatabase };









