import path from 'path';
import { fileURLToPath } from 'url';

// Replicate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  // Mode: 'production' for optimized builds, 'development' for easier debugging
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // *** Disable Webpack Cache ***
  cache: false,
  // *** End Disable Cache ***
  
  // CHANGE Entry point: Point to the ORIGINAL TypeScript worker file
  entry: './app/shapedoctor/solver.worker.ts', 
  
  // Output configuration
  output: {
    // Output directory (matches where the app expects it)
    path: path.resolve(__dirname, 'public/workers'),
    // Output filename
    filename: 'solver.worker.js',
    // Important for web workers: ensures 'self' is the global object
    globalObject: 'self', 
  },
  
  // Resolve TypeScript and JavaScript files
  resolve: {
    // CHANGE: Add .ts extension
    extensions: ['.ts', '.js'], 
    // REMOVE fullySpecified: false (likely not needed now)
    // fullySpecified: false, 
    // Add fallbacks for Node.js built-ins used by workerpool
    fallback: {
      "worker_threads": false,
      "os": false,
      "child_process": false,
      "fs": false, 
      "path": false 
    }
  },
  
  // ADD Module rules for TypeScript
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          // CHANGE: Explicitly tell ts-loader which config file to use
          options: {
            configFile: 'tsconfig.worker.json' 
          }
        }
      }
    ],
  },
  
  // Target environment (important for workers)
  target: 'webworker', 
  
  // Optional: Source maps for debugging (useful in development)
  devtool: process.env.NODE_ENV === 'development' ? 'inline-source-map' : false,
};

export default config; 