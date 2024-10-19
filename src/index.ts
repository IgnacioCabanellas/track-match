import fs from 'fs-extra';
import path from 'path';
import leven from 'leven';

const SIMILARITY_THRESHOLD = 10;

const normalizeFileName = (fileName: string): string => 
  fileName.toLowerCase()
    .replace(/[_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\(.*?\)/g, '')
    .trim();

const getMp3FilesFromFolders = async (folderPaths: string[]): Promise<string[][]> => 
  Promise.all(
    folderPaths.map(async (folderPath) => {
      try {
        const files = await fs.readdir(folderPath);
        return files.filter(file => file.endsWith('.mp3'));
      } catch (error) {
        console.error(`Error reading folder ${folderPath}:`, error);
        return [];
      }
    })
  );

const findSimilarFilesAcrossFolders = (filesByFolders: string[][]): void => {
  const matchesSummary: { [key: string]: string[] } = {};
  for (let index1 = 0; index1 < filesByFolders.length; index1++) {
    for (let index2 = index1 + 1; index2 < filesByFolders.length; index2++) {
      console.log(`\nComparing folder ${index1 + 1} with folder ${index2 + 1}`);
      const files1 = filesByFolders[index1];
      const files2 = filesByFolders[index2];

      files1.forEach(file1 => {
        const normalizedFile1 = normalizeFileName(file1);
        const matches = files2.filter(file2 => 
          leven(normalizeFileName(file2), normalizedFile1) <= SIMILARITY_THRESHOLD
        );

        if (matches.length > 0) {
          if (!matchesSummary[file1]) matchesSummary[file1] = [];
          matchesSummary[file1].push(...matches);
          console.log(`Matches for "${file1}": ${matches.join(', ')}`);
        }
      });
    }
  }

  console.log('\nSummary of matches found:');
  for (const [file, matchedFiles] of Object.entries(matchesSummary)) {
    console.log(`- "${file}" matches with: ${matchedFiles.join(', ')}`);
  }
};

const FOLDERS = [
  path.resolve('./track_folders/A'),
  path.resolve('./track_folders/B'),
];

(async () => {
  const filesByFolders = await getMp3FilesFromFolders(FOLDERS);
  filesByFolders.forEach((files, index) => {
    console.log(`Files in folder ${index + 1}: ${files.length}`);
  });
  findSimilarFilesAcrossFolders(filesByFolders);
})();
