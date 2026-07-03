import sys
from graphify.serve import serve

if __name__ == '__main__':
    graph_path = sys.argv[1] if len(sys.argv) > 1 else 'graphify-out/graph.json'
    serve(graph_path)
