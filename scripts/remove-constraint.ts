import { removeUrlOrPlaceConstraint } from '../src/lib/supabase/migrate'

async function main() {
  try {
    await removeUrlOrPlaceConstraint()
    console.log('Done!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main() 