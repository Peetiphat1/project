async function seed() {
  const routes = [
    {
      name: 'Kathu Trail Loop',
      distance: 14.2,
      elevation: 312,
      terrain: 'Trail',
      notes: 'Good climb, technical descent.',
      isFavorite: true,
    },
    {
      name: 'Saphan Hin Coastal',
      distance: 10.0,
      elevation: 15,
      terrain: 'Road',
      notes: 'Flat and fast for tempo runs.',
      isFavorite: false,
    },
    {
      name: 'Big Buddha Climb',
      distance: 6.5,
      elevation: 450,
      terrain: 'Mixed',
      notes: 'Brutal uphill sections.',
      isFavorite: true,
    }
  ];

  const gear = [
    {
      brandModel: 'Nike Vaporfly 3',
      dateAcquired: '2023-09-01',
      startingMileage: 350,
      targetLifespan: 800,
      status: 'Active',
    },
    {
      brandModel: 'Hoka Speedgoat 5',
      dateAcquired: '2024-01-15',
      startingMileage: 680,
      targetLifespan: 700,
      status: 'Retiring Soon',
    },
    {
      brandModel: 'Asics Novablast 4',
      dateAcquired: '2024-03-10',
      startingMileage: 120,
      targetLifespan: 1000,
      status: 'Default',
    }
  ];

  console.log('Seeding Routes...');
  for (const r of routes) {
    const res = await fetch('http://localhost:3000/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r)
    });
    console.log(r.name, res.status);
  }

  console.log('Seeding Gear...');
  for (const g of gear) {
    const res = await fetch('http://localhost:3000/api/gear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g)
    });
    console.log(g.brandModel, res.status);
  }
}

seed().catch(console.error);
