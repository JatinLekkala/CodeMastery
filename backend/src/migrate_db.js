const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = 'codemastery';
const dumpFile = path.join(__dirname, 'codemastery_dump.json');

// Custom replacer to serialize ObjectIds and Dates to EJSON format
function replacer(key, value) {
  if (this[key] instanceof Date) {
    return { $date: this[key].toISOString() };
  }
  if (this[key] && (this[key]._bsontype === 'ObjectID' || typeof this[key].toHexString === 'function')) {
    const hex = typeof this[key].toHexString === 'function' ? this[key].toHexString() : this[key].toString();
    return { $oid: hex };
  }
  return value;
}

// Custom reviver to parse EJSON formatting back to ObjectIds and Dates
function reviver(key, value) {
  if (value && typeof value === 'object') {
    if (value.$oid) {
      return new ObjectId(value.$oid);
    }
    if (value.$date) {
      return new Date(value.$date);
    }
  }
  return value;
}

async function dump() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB at ' + uri + ' for backup...');
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    const backupData = {};

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;
      
      console.log(`Dumping collection: ${colName}...`);
      const documents = await db.collection(colName).find({}).toArray();
      backupData[colName] = documents;
    }

    fs.writeFileSync(dumpFile, JSON.stringify(backupData, replacer, 2));
    console.log(`\nSuccess! Database backed up to ${dumpFile}`);
    console.log('You can now copy this file to your EC2 instance.');
  } catch (err) {
    console.error('Error during dump:', err);
  } finally {
    await client.close();
  }
}

async function restore() {
  const client = new MongoClient(uri);
  try {
    if (!fs.existsSync(dumpFile)) {
      console.error(`Error: Backup file not found at ${dumpFile}`);
      return;
    }

    await client.connect();
    console.log('Connected to MongoDB at ' + uri + ' for restore...');
    const db = client.db(dbName);
    const backupData = JSON.parse(fs.readFileSync(dumpFile, 'utf8'), reviver);

    for (const [colName, documents] of Object.entries(backupData)) {
      if (documents.length === 0) {
        console.log(`Collection ${colName} is empty, skipping...`);
        continue;
      }

      console.log(`Restoring collection: ${colName} (${documents.length} docs)...`);
      try {
        await db.collection(colName).drop();
      } catch (e) {
        // Ignore if collection doesn't exist yet
      }
      await db.collection(colName).insertMany(documents);
    }

    console.log('\nSuccess! Database restore completed successfully.');
  } catch (err) {
    console.error('Error during restore:', err);
  } finally {
    await client.close();
  }
}

const mode = process.argv[2];
if (mode === '--dump') {
  dump();
} else if (mode === '--restore') {
  restore();
} else {
  console.log('Usage:');
  console.log('  node src/migrate_db.js --dump      (Backup local DB)');
  console.log('  node src/migrate_db.js --restore   (Restore backup file to DB)');
}
