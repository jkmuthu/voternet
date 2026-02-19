import { AppDataSource } from '../libraries/database/data-source.js';
import { User, UserRole } from '../libraries/database/entities/User.js';
import bcryptjs from 'bcryptjs';

async function seedTestUsers() {
  try {
    console.log('🌱 Seeding test users...');
    
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);

    // Check if users already exist
    const existingAdmin = await userRepository.findOne({ 
      where: { email: 'admin@voternet.com' } 
    });
    
    const existingVoter = await userRepository.findOne({ 
      where: { email: 'voter@voternet.com' } 
    });

    // Create Admin User
    if (!existingAdmin) {
      const adminPassword = await bcryptjs.hash('Admin123!', 10);
      const admin = userRepository.create({
        email: 'admin@voternet.com',
        passwordHash: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: true
      });
      await userRepository.save(admin);
      console.log('✅ Admin user created');
      console.log('   Email: admin@voternet.com');
      console.log('   Password: Admin123!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create Regular Voter User
    if (!existingVoter) {
      const voterPassword = await bcryptjs.hash('Voter123!', 10);
      const voter = userRepository.create({
        email: 'voter@voternet.com',
        passwordHash: voterPassword,
        firstName: 'John',
        lastName: 'Voter',
        role: UserRole.VOTER,
        isActive: true,
        emailVerified: true
      });
      await userRepository.save(voter);
      console.log('✅ Voter user created');
      console.log('   Email: voter@voternet.com');
      console.log('   Password: Voter123!');
    } else {
      console.log('ℹ️  Voter user already exists');
    }

    console.log('\n✨ Test users seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 ADMIN USER:');
    console.log('   Email:    admin@voternet.com');
    console.log('   Password: Admin123!');
    console.log('   Role:     ADMIN');
    console.log('\n👤 VOTER USER:');
    console.log('   Email:    voter@voternet.com');
    console.log('   Password: Voter123!');
    console.log('   Role:     VOTER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedTestUsers();
