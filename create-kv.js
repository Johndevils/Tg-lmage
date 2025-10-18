#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Creating Cloudflare KV namespaces...');

// Check if Wrangler is logged in
function checkWranglerLogin() {
  try {
    console.log('Checking Wrangler login status...');
    const whoamiOutput = execSync('npx wrangler whoami', { encoding: 'utf8' });
    console.log('Wrangler is logged in:', whoamiOutput);
    return true;
  } catch (error) {
    console.error('Wrangler is not logged in:', error.message);
    console.log('Please run `npx wrangler login` to log into your Cloudflare account.');
    return false;
  }
}

// Ensure Wrangler is logged in
if (!checkWranglerLogin()) {
  console.log('Trying automatic login...');
  try {
    execSync('npx wrangler login', { stdio: 'inherit' });
  } catch (error) {
    console.error('Automatic login failed. Please log in manually and rerun this script.');
    process.exit(1);
  }
}

// Read wrangler.toml file
const wranglerTomlPath = path.join(process.cwd(), 'wrangler.toml');
let wranglerToml = fs.readFileSync(wranglerTomlPath, 'utf8');

// Extract existing KV namespace IDs
const imgUrlIdMatch = wranglerToml.match(/binding\s*=\s*"img_url"\s*\nid\s*=\s*"([^"]+)"/);
const usersIdMatch = wranglerToml.match(/binding\s*=\s*"users"\s*\nid\s*=\s*"([^"]+)"/);

const imgUrlId = imgUrlIdMatch ? imgUrlIdMatch[1] : null;
const usersId = usersIdMatch ? usersIdMatch[1] : null;

try {
  // --- Create img_url namespace if it doesn’t exist ---
  console.log('1. Checking img_url KV namespace...');
  let newImgUrlId = imgUrlId;

  try {
    console.log('   Running command: npx wrangler kv namespace list');
    const kvListOutput = execSync('npx wrangler kv namespace list', { encoding: 'utf8' });
    console.log('   Successfully retrieved KV namespace list');
    console.log('   Output:', kvListOutput);
    const imgUrlExists = kvListOutput.includes('img_url');

    if (!imgUrlExists) {
      console.log('   img_url namespace does not exist. Creating...');
      console.log('   Running command: npx wrangler kv namespace create "img_url"');
      const createOutput = execSync('npx wrangler kv namespace create "img_url"', { encoding: 'utf8' });
      console.log('   Created successfully!');
      console.log('   Output:', createOutput);

      // Extract the new namespace ID
      const idMatch = createOutput.match(/id\s*=\s*"([^"]+)"/);
      if (idMatch) {
        newImgUrlId = idMatch[1];
        console.log(`   New img_url KV namespace ID: ${newImgUrlId}`);
      }
    } else {
      console.log('   img_url namespace already exists.');
      if (!newImgUrlId) {
        try {
          const namespaces = JSON.parse(kvListOutput);
          const imgUrlNamespace = namespaces.find(ns => ns.title === 'img_url');
          if (imgUrlNamespace) {
            newImgUrlId = imgUrlNamespace.id;
            console.log(`   Found img_url KV namespace ID: ${newImgUrlId}`);
          }
        } catch (error) {
          console.error('   Failed to parse KV namespace list:', error);
          const kvInfo = kvListOutput.split('\n').find(line => line.includes('img_url'));
          if (kvInfo) {
            const idMatch = kvInfo.match(/id:\s*([a-f0-9]+)/);
            if (idMatch) {
              newImgUrlId = idMatch[1];
              console.log(`   Found img_url KV namespace ID: ${newImgUrlId}`);
            }
          }
        }
      }
    }

    // Update wrangler.toml with new img_url ID
    if (newImgUrlId && newImgUrlId !== imgUrlId) {
      wranglerToml = wranglerToml.replace(
        /binding\s*=\s*"img_url"\s*\nid\s*=\s*"[^"]*"/,
        `binding = "img_url"\nid = "${newImgUrlId}"`
      );
      console.log(`   Updated img_url KV namespace ID in wrangler.toml.`);
    }
  } catch (error) {
    console.error('   Error while checking/creating img_url namespace:', error.message);
  }

  // --- Create users namespace if it doesn’t exist ---
  console.log('2. Checking users KV namespace...');
  let newUsersId = usersId;

  try {
    console.log('   Running command: npx wrangler kv namespace list');
    const kvListOutput = execSync('npx wrangler kv namespace list', { encoding: 'utf8' });
    console.log('   Successfully retrieved KV namespace list');
    console.log('   Output:', kvListOutput);
    const usersExists = kvListOutput.includes('users');

    if (!usersExists) {
      console.log('   users namespace does not exist. Creating...');
      console.log('   Running command: npx wrangler kv namespace create "users"');
      const createOutput = execSync('npx wrangler kv namespace create "users"', { encoding: 'utf8' });
      console.log('   Created successfully!');
      console.log('   Output:', createOutput);

      const idMatch = createOutput.match(/id\s*=\s*"([^"]+)"/);
      if (idMatch) {
        newUsersId = idMatch[1];
        console.log(`   New users KV namespace ID: ${newUsersId}`);
      }
    } else {
      console.log('   users namespace already exists.');
      if (!newUsersId) {
        try {
          const namespaces = JSON.parse(kvListOutput);
          const usersNamespace = namespaces.find(ns => ns.title === 'users');
          if (usersNamespace) {
            newUsersId = usersNamespace.id;
            console.log(`   Found users KV namespace ID: ${newUsersId}`);
          }
        } catch (error) {
          console.error('   Failed to parse KV namespace list:', error);
          const kvInfo = kvListOutput.split('\n').find(line => line.includes('users'));
          if (kvInfo) {
            const idMatch = kvInfo.match(/id:\s*([a-f0-9]+)/);
            if (idMatch) {
              newUsersId = idMatch[1];
              console.log(`   Found users KV namespace ID: ${newUsersId}`);
            }
          }
        }
      }
    }

    // Update wrangler.toml with new users ID
    if (newUsersId && newUsersId !== usersId) {
      wranglerToml = wranglerToml.replace(
        /binding\s*=\s*"users"\s*\nid\s*=\s*"[^"]*"/,
        `binding = "users"\nid = "${newUsersId}"`
      );
      console.log(`   Updated users KV namespace ID in wrangler.toml.`);
    }
  } catch (error) {
    console.error('   Error while checking/creating users namespace:', error.message);
  }

  // Save the updated wrangler.toml file
  fs.writeFileSync(wranglerTomlPath, wranglerToml);
  console.log('✅ KV namespace check/create process completed! wrangler.toml has been updated.');
} catch (error) {
  console.error('❌ An error occurred while creating KV namespaces:', error.message);
  process.exit(1);
}
