const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ubdevaemtwbzxksjlhjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_1qhA0xAnNSd3VxpoLdxYrQ_yUemEhaP";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const dummyBlob = Buffer.from("test pdf content");
  const filename = "bulletin_test.pdf";
  
  console.log("Attempting upload to Supabase...");
  const { data, error } = await supabase.storage
    .from('vigilance-captures')
    .upload(filename, dummyBlob, {
      contentType: 'application/pdf',
      upsert: true
    });
    
  if (error) {
    console.error("Upload failed!");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("Upload succeeded!", data);
    
    // Clean up
    console.log("Cleaning up test file...");
    const { error: delError } = await supabase.storage
      .from('vigilance-captures')
      .remove([filename]);
    if (delError) console.error("Clean up failed:", delError);
    else console.log("Clean up succeeded.");
  }
}

test();
