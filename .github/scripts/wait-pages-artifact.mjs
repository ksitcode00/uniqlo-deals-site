import {pathToFileURL} from 'node:url';
export async function waitForPagesArtifact({repository,runId,artifactId,token,fetcher=fetch,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=10}){
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository??'')||!/^\d+$/.test(String(runId??''))||!/^\d+$/.test(String(artifactId??''))||!token||!Number.isInteger(attempts)||attempts<1||attempts>30)throw Error('Invalid Pages artifact context');
 const url=`https://api.github.com/repos/${repository}/actions/runs/${runId}/artifacts?name=github-pages&per_page=100`;
 for(let attempt=1;attempt<=attempts;attempt++){
  const response=await fetcher(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json'},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(response.ok){const data=await response.json();if(!Array.isArray(data.artifacts))throw Error('Invalid artifact API response');
   if(data.artifacts.some(a=>String(a.id)===String(artifactId)&&a.name==='github-pages'&&a.expired===false&&a.size_in_bytes>0))return String(artifactId);
  }else if(response.status!==429&&response.status<500)throw Error(`Artifact metadata request failed (${response.status})`);
  if(attempt<attempts)await pause(3000);
 }
 throw Error(`Pages artifact ${artifactId} not ready in workflow run ${runId}; deployment stopped`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const artifactId=await waitForPagesArtifact({repository:process.env.GITHUB_REPOSITORY,runId:process.env.GITHUB_RUN_ID,artifactId:process.env.PAGES_ARTIFACT_ID,token:process.env.GH_TOKEN});
 console.log(`Verified Pages artifact ${artifactId} in this workflow run.`);
}
